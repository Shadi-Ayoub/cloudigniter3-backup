import {
  ciStringField,
  ciSha,
  ciPullUrl,
  ciGithub,
  ciCleanBase,
} from "./github-api.mjs";
import { ciAuthorizeRequester } from "./github-policy.mjs";
import { ciSubmitPairedRelease } from "./paired-releases.mjs";
import { ciReadPolicy, ciIsRecord } from "./policy.mjs";
import {
  ciCreateReleasePlan,
  ciDigest,
  ciSerializeChangeset,
} from "./release-plan.mjs";
import { ciRun, CiDevUsageError, ciErrorMessage } from "./runtime.mjs";

/** @param {import('./types.d.mts').ReleaseProposal} plan @param {string} sha */
function ciRequestBody(plan, sha) {
  return [
    "## Release intent",
    "",
    plan.summary,
    "",
    "| Package | Current | Proposed | Access | Reason |",
    "| --- | --- | --- | --- | --- |",
    ...plan.releases.map(
      (release) =>
        `| ${release.name} | ${release.oldVersion} | ${release.newVersion} | ${release.access} | ${release.reason} |`
    ),
    "",
    `Source commit: \`${sha}\``,
    `Registry: \`${plan.registry}\``,
    `Distribution tag: \`${plan.tag}\``,
    "",
    "This PR records release intent and a calculated proposal. It does not contain built package archives, change package versions, or publish to npm.",
    "",
    "After review, a configured release workflow must apply Changesets, update the lockfile, run package quality/build/pack checks, and obtain artifact approval before publishing.",
    "",
    ...plan.warnings.map((warning) => `- ${warning}`),
    "",
    "Branch protection, required reviewers, and npm publishing permissions must enforce authorization independently of this CLI.",
    "",
  ].join("\n");
}

/**
 * Create only a release-intent commit on GitHub. Never stage, commit, switch,
 * push, version, or publish from the developer's local working tree.
 * @param {string} root
 * @param {import('./types.d.mts').PlanOptions} options
 * @param {import('./types.d.mts').Runner} [run]
 */
export async function ciSubmitRelease(root, options, run = ciRun) {
  const policy = await ciReadPolicy(root);
  if (policy.topology === "paired")
    return ciSubmitPairedRelease(root, options, run);
  if (!policy.repository)
    throw new CiDevUsageError(
      "Set repository in .cloudigniter/release-policy.json to the approved GitHub owner/repository. No remote is selected automatically."
    );
  if (policy.reviewers.length === 0)
    throw new CiDevUsageError(
      "Configure at least one release reviewer or team in release-policy.json."
    );
  if (!options.changed && !options.summary?.trim())
    throw new CiDevUsageError(
      "A release request requires --summary describing the change. --dry-run can omit it."
    );
  const sha = await ciCleanBase(root, policy.baseBranch, run);
  const plan = await ciCreateReleasePlan(root, options);
  const api = ciGithub(root, run);
  const repository = policy.repository;
  if (
    policy.reviewers.some(
      (reviewer) =>
        reviewer.includes("/") &&
        reviewer.split("/")[0].toLowerCase() !==
          repository.split("/")[0].toLowerCase()
    )
  )
    throw new CiDevUsageError(
      "Reviewer teams must belong to the configured repository's organization."
    );
  const repoPath = `repos/${repository}`;
  const user = await api("user");
  const login = ciStringField(user, "login");
  await ciAuthorizeRequester(root, login);
  const reviewers = policy.reviewers.filter(
    (reviewer) => reviewer.toLowerCase() !== login.toLowerCase()
  );
  if (!reviewers.length)
    throw new CiDevUsageError(
      "The requester cannot be the only configured reviewer. Configure another maintainer or team."
    );
  const baseEndpoint = `${repoPath}/git/ref/heads/${encodeURIComponent(
    policy.baseBranch
  )}`;
  const remote = await api(baseEndpoint);
  if (!ciIsRecord(remote) || ciSha(remote.object) !== sha)
    throw new CiDevUsageError(
      `Local HEAD differs from GitHub ${policy.baseBranch}. Synchronize it and review the proposal again.`
    );
  const request = { schemaVersion: 1, baseCommit: sha, reviewers, plan };
  const id = ciDigest(request).slice(0, 24);
  const branch = `release/cloudigniter/${id}`;
  const requestPath = `.cloudigniter/releases/${id}.json`;
  const branchEndpoint = `${repoPath}/git/ref/heads/${encodeURIComponent(
    branch
  )}`;
  // Refuse a competing release request so two proposals cannot silently consume
  // the same pending Changesets. GitHub protection still owns cross-client races.
  const pulls = await api(
    `${repoPath}/pulls?state=open&base=${encodeURIComponent(
      policy.baseBranch
    )}&per_page=100`
  );
  if (!Array.isArray(pulls))
    throw new Error("Unexpected GitHub pull request list.");
  if (pulls.length === 100)
    throw new CiDevUsageError(
      "The open-PR listing reached its limit. Resolve pending requests or narrow the repository release process before submitting."
    );
  for (const pull of pulls) {
    if (
      ciIsRecord(pull) &&
      ciIsRecord(pull.head) &&
      typeof pull.head.ref === "string" &&
      pull.head.ref.startsWith("release/cloudigniter/") &&
      pull.head.ref !== branch
    ) {
      throw new CiDevUsageError(
        `Another release request is open: ${ciPullUrl(
          pull,
          repository
        )}. Resolve it before creating a competing request.`
      );
    }
  }
  const existingPr = pulls.find(
    (pull) =>
      ciIsRecord(pull) && ciIsRecord(pull.head) && pull.head.ref === branch
  );
  if (
    existingPr &&
    (!ciIsRecord(existingPr.head.repo) ||
      existingPr.head.repo.full_name !== repository)
  )
    throw new CiDevUsageError(
      "A matching release request comes from another repository. Review it manually."
    );
  const baseCommit = await api(`${repoPath}/git/commits/${sha}`);
  if (!ciIsRecord(baseCommit))
    throw new Error("Unexpected GitHub commit response.");
  const baseTree = ciSha(baseCommit.tree);
  const files = [
    {
      path: requestPath,
      mode: "100644",
      type: "blob",
      content: `${JSON.stringify(request, null, 2)}\n`,
    },
  ];
  if (plan.newChangeset)
    files.push({
      path: `.changeset/${plan.newChangeset.id}.md`,
      mode: "100644",
      type: "blob",
      content: ciSerializeChangeset(plan.newChangeset),
    });
  if (plan.enterPreState)
    files.push({
      path: ".changeset/pre.json",
      mode: "100644",
      type: "blob",
      content: `${JSON.stringify(plan.enterPreState, null, 2)}\n`,
    });
  // Recheck local inputs and remote HEAD immediately before the first write.
  if (
    (await ciCleanBase(root, policy.baseBranch, run)) !== sha ||
    ciDigest(await ciReadPolicy(root)) !== ciDigest(policy) ||
    ciDigest(await ciCreateReleasePlan(root, options)) !== ciDigest(plan)
  ) {
    throw new CiDevUsageError(
      "Release inputs changed during preflight. Run the command again."
    );
  }
  const freshBase = await api(baseEndpoint);
  if (!ciIsRecord(freshBase) || ciSha(freshBase.object) !== sha)
    throw new CiDevUsageError(
      "The GitHub base branch changed during preflight. Synchronize before retrying."
    );
  let existingRef;
  try {
    existingRef = await api(branchEndpoint);
  } catch (error) {
    if (!/HTTP 404/.test(ciErrorMessage(error))) throw error;
  }
  const tree = await api(`${repoPath}/git/trees`, {
    base_tree: baseTree,
    tree: files,
  });
  const treeSha = ciSha(tree);
  if (existingRef) {
    if (!ciIsRecord(existingRef))
      throw new Error("Unexpected GitHub branch response.");
    const commit = await api(
      `${repoPath}/git/commits/${ciSha(existingRef.object)}`
    );
    if (
      !ciIsRecord(commit) ||
      ciSha(commit.tree) !== treeSha ||
      !Array.isArray(commit.parents) ||
      commit.parents.length !== 1 ||
      ciSha(commit.parents[0]) !== sha
    ) {
      throw new CiDevUsageError(
        `Release branch ${branch} was modified. Review it manually; dev will not overwrite it.`
      );
    }
  } else {
    const commit = await api(`${repoPath}/git/commits`, {
      message: `chore(release): request ${id}`,
      tree: treeSha,
      parents: [sha],
    });
    // Creating a ref fails on collisions; no force update is ever attempted.
    await api(`${repoPath}/git/refs`, {
      ref: `refs/heads/${branch}`,
      sha: ciSha(commit),
    });
  }
  try {
    let pr = existingPr;
    if (!pr)
      pr = await api(`${repoPath}/pulls`, {
        title: `chore(release): request ${
          plan.releases.length
        } package release${plan.releases.length === 1 ? "" : "s"}`,
        head: branch,
        base: policy.baseBranch,
        body: ciRequestBody(plan, sha),
      });
    if (!ciIsRecord(pr) || typeof pr.number !== "number")
      throw new Error("Unexpected pull request number.");
    const url = ciPullUrl(pr, repository);
    // Retry this call for existing PRs as well, so a failed reviewer assignment
    // is recoverable by re-running the identical release command.
    await api(`${repoPath}/pulls/${pr.number}/requested_reviewers`, {
      reviewers: reviewers.filter((reviewer) => !reviewer.includes("/")),
      team_reviewers: reviewers
        .filter((reviewer) => reviewer.includes("/"))
        .map((reviewer) => reviewer.split("/")[1]),
    });
    return {
      status: "awaiting-review",
      id,
      branch,
      url,
      number: pr.number,
      reused: Boolean(existingPr),
      published: false,
      plan,
    };
  } catch (error) {
    throw new Error(
      `Release branch ${branch} exists on ${repository}, but PR creation or reviewer assignment did not finish. Re-run the same command to recover, or inspect the branch. ${ciErrorMessage(
        error
      )}`
    );
  }
}

/** @param {string} root @param {string} number @param {import('./types.d.mts').Runner} [run] @param {string} [packageName] */
export async function ciReleaseStatus(root, number, run = ciRun, packageName) {
  if (!/^[1-9][0-9]*$/.test(number))
    throw new CiDevUsageError(
      "npm status requires a positive GitHub pull request number."
    );
  const configured = await ciReadPolicy(root);
  const policy = {
    ...configured,
    repository:
      configured.topology === "paired"
        ? configured.packages[packageName ?? ""]?.sourceRepository
        : configured.repository,
  };
  if (!policy.repository)
    throw new CiDevUsageError(
      "For paired repositories, select one --package when checking a source PR number. Otherwise configure the release repository."
    );
  const api = ciGithub(root, run);
  const pr = await api(`repos/${policy.repository}/pulls/${number}`);
  if (
    !ciIsRecord(pr) ||
    !ciIsRecord(pr.head) ||
    !ciIsRecord(pr.base) ||
    typeof pr.head.ref !== "string" ||
    !pr.head.ref.startsWith("release/cloudigniter/") ||
    pr.base.ref !== policy.baseBranch
  ) {
    throw new CiDevUsageError(
      "This PR is not a CloudIgniter release request for the configured base branch."
    );
  }
  return {
    number: Number(number),
    url: ciPullUrl(pr, policy.repository),
    title: ciStringField(pr, "title"),
    status: pr.merged_at
      ? "request-merged"
      : pr.state === "closed"
      ? "request-closed"
      : "request-open",
    publication: "unverified",
    message:
      "PR status does not establish approval or npm publication. Check the approved publishing workflow and registry separately.",
  };
}
