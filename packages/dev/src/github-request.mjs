import { ciGithub, ciSha, ciPullUrl } from "./github-api.mjs";
import { ciIsRecord } from "./policy.mjs";
import { CiDevUsageError, ciErrorMessage } from "./runtime.mjs";

/** @param {string} root
 * @param {{repository: string, baseBranch: string, baseSha: string, branch: string, prefix: string, files: Array<{path: string, content?: string, sha?: string|null, mode?: string}>, title: string, body: string, reviewers: string[]}} request
 * @param {import('./types.d.mts').Runner} run
 */
export async function ciCreateReviewRequest(root, request, run) {
  const api = ciGithub(root, run);
  const repo = `repos/${request.repository}`;
  const baseEndpoint = `${repo}/git/ref/heads/${encodeURIComponent(
    request.baseBranch
  )}`;
  const base = await api(baseEndpoint);
  if (!ciIsRecord(base) || ciSha(base.object) !== request.baseSha)
    throw new CiDevUsageError(
      "Local HEAD differs from the private GitHub base branch. Synchronize first."
    );
  const pulls = await api(
    `${repo}/pulls?state=open&base=${encodeURIComponent(
      request.baseBranch
    )}&per_page=100`
  );
  if (!Array.isArray(pulls) || pulls.length >= 100)
    throw new CiDevUsageError("Cannot safely list pending requests.");
  const existing = pulls.find(
    (pr) =>
      ciIsRecord(pr) && ciIsRecord(pr.head) && pr.head.ref === request.branch
  );
  if (
    existing &&
    (!ciIsRecord(existing.head.repo) ||
      existing.head.repo.full_name !== request.repository)
  )
    throw new CiDevUsageError(
      "Matching request belongs to another repository."
    );
  if (
    pulls.some(
      (pr) =>
        ciIsRecord(pr) &&
        ciIsRecord(pr.head) &&
        typeof pr.head.ref === "string" &&
        pr.head.ref.startsWith(request.prefix) &&
        pr.head.ref !== request.branch
    )
  )
    throw new CiDevUsageError(
      "Another publication request is open; resolve it first."
    );
  const commit = await api(`${repo}/git/commits/${request.baseSha}`);
  if (!ciIsRecord(commit)) throw new Error("Invalid base commit.");
  const fresh = await api(baseEndpoint);
  if (!ciIsRecord(fresh) || ciSha(fresh.object) !== request.baseSha)
    throw new CiDevUsageError("Private GitHub base changed during preflight.");
  const treeSha = ciSha(
    await api(`${repo}/git/trees`, {
      base_tree: ciSha(commit.tree),
      tree: request.files.map((file) => ({
        ...file,
        mode: file.mode ?? "100644",
        type: "blob",
      })),
    })
  );
  let ref;
  try {
    ref = await api(
      `${repo}/git/ref/heads/${encodeURIComponent(request.branch)}`
    );
  } catch (error) {
    if (!/HTTP 404/.test(ciErrorMessage(error))) throw error;
  }
  if (ref) {
    if (!ciIsRecord(ref)) throw new Error("Invalid request ref.");
    const head = await api(`${repo}/git/commits/${ciSha(ref.object)}`);
    if (
      !ciIsRecord(head) ||
      ciSha(head.tree) !== treeSha ||
      !Array.isArray(head.parents) ||
      head.parents.length !== 1 ||
      ciSha(head.parents[0]) !== request.baseSha
    )
      throw new CiDevUsageError(
        "Request branch was modified; dev will not overwrite it."
      );
  } else {
    const head = await api(`${repo}/git/commits`, {
      message: request.title,
      tree: treeSha,
      parents: [request.baseSha],
    });
    await api(`${repo}/git/refs`, {
      ref: `refs/heads/${request.branch}`,
      sha: ciSha(head),
    });
  }
  try {
    const pr =
      existing ??
      (await api(`${repo}/pulls`, {
        title: request.title,
        head: request.branch,
        base: request.baseBranch,
        body: request.body,
      }));
    if (!ciIsRecord(pr) || typeof pr.number !== "number")
      throw new Error("Invalid PR response.");
    const url = ciPullUrl(pr, request.repository);
    await api(`${repo}/pulls/${pr.number}/requested_reviewers`, {
      reviewers: request.reviewers.filter((name) => !name.includes("/")),
      team_reviewers: request.reviewers
        .filter((name) => name.includes("/"))
        .map((name) => name.split("/")[1]),
    });
    return {
      status: "awaiting-review",
      url,
      number: pr.number,
      branch: request.branch,
      reused: Boolean(existing),
      published: false,
    };
  } catch (error) {
    throw new Error(
      `Request branch ${
        request.branch
      } exists. Re-run the identical command to recover PR/reviewer creation. ${ciErrorMessage(
        error
      )}`
    );
  }
}
