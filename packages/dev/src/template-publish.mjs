import path from "node:path";
import { realpath, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { ciCreateReviewRequest } from "./github-request.mjs";
import {
  ciPlanTemplateExport,
  ciAssertTemplateMatches,
} from "./template-export.mjs";
import { ciReadGithubPolicy, ciAuthorizeRequester } from "./github-policy.mjs";
import {
  ciGithub,
  ciCleanBase,
  ciSha,
  ciStringField,
  ciPullUrl,
} from "./github-api.mjs";
import { ciReadPolicy, ciIsRecord } from "./policy.mjs";
import { ciDigest } from "./release-plan.mjs";
import { CiDevUsageError, ciRun, ciErrorMessage } from "./runtime.mjs";

const manifestPath = ".cloudigniter-template.json";
const branchPrefix = "template/cloudigniter/";

/** @param {string} root
 * @param {import('./template-export.mjs').CiTemplateOptions & {output?: string, dryRun?: boolean, summary?: string}} options
 * @param {import('./types.d.mts').Runner} [run]
 */
export async function ciSubmitTemplate(root, options, run = ciRun) {
  const preview = await ciPublishCandidate(
    root,
    { ...options, dryRun: true },
    run,
  );
  if (options.dryRun) return preview;
  const github = await ciReadGithubPolicy(root);
  const release = await ciReadPolicy(root);
  const policy = {
    ...release,
    repository: github.template.requestRepository ?? release.repository,
  };
  if (!policy.repository || !github.template.repository)
    throw new CiDevUsageError(
      "Configure github-policy.template.requestRepository and its public repository first (legacy requests can use release-policy.repository).",
    );
  if (
    policy.repository.toLowerCase() === github.template.repository.toLowerCase()
  )
    throw new CiDevUsageError(
      "Private request and public template repositories must differ.",
    );
  if (
    !options.summary?.trim() ||
    options.summary.length > 4000 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(options.summary)
  )
    throw new CiDevUsageError(
      "template publish requires --summary (up to 4000 characters, no terminal controls).",
    );
  const sha = await ciCleanBase(root, policy.baseBranch, run);
  const api = ciGithub(root, run);
  const login = ciStringField(await api("user"), "login");
  await ciAuthorizeRequester(root, login);
  const reviewers = github.template.reviewers.filter(
    (name) => name.toLowerCase() !== login.toLowerCase(),
  );
  if (!reviewers.length || reviewers.some((name) => name.includes("/")))
    throw new CiDevUsageError(
      "Configure another individual template reviewer; delivery verifies their approval.",
    );
  const repo = await api(`repos/${policy.repository}`);
  if (
    !ciIsRecord(repo) ||
    repo.private !== true ||
    repo.archived !== false ||
    repo.full_name !== policy.repository
  )
    throw new CiDevUsageError(
      "Template publication requests must be stored in the configured private repository.",
    );
  const plan = await ciPlanTemplateExport(root, options);
  const request = {
    schemaVersion: 1,
    sourceCommit: sha,
    source: plan.source,
    policy: plan.policy,
    name: plan.name,
    packageVersion: options.packageVersion ?? null,
    digest: plan.digest,
    destination: github.template.repository,
    summary: options.summary.trim(),
  };
  const id = ciDigest(request).slice(0, 24);
  let requestBase = sha;
  if (github.template.requestRepository) {
    const base = await api(
      `repos/${policy.repository}/git/ref/heads/${encodeURIComponent(policy.baseBranch)}`,
    );
    if (!ciIsRecord(base)) throw new Error("Invalid private template base.");
    requestBase = ciSha(base.object);
  }
  if (
    (await ciCleanBase(root, policy.baseBranch, run)) !== sha ||
    (await ciPublishCandidate(root, { ...options, dryRun: true }, run))
      .digest !== preview.digest
  )
    throw new CiDevUsageError("Template inputs changed during preflight.");
  const result = await ciCreateReviewRequest(
    root,
    {
      repository: policy.repository,
      baseBranch: policy.baseBranch,
      baseSha: requestBase,
      branch: `${branchPrefix}${id}`,
      prefix: branchPrefix,
      files: [
        {
          path: `.cloudigniter/template-releases/${id}.json`,
          content: `${JSON.stringify(request, null, 2)}\n`,
        },
      ],
      title: `chore(template): request ${plan.name}`,
      reviewers,
      body: `${request.summary}\n\nDestination: ${request.destination}\nSource commit: \`${sha}\`\nExport SHA-256: \`${plan.digest}\`\n\nReview the source, export policy and reproducible candidate before merging. No public files have been uploaded. After merge, an authorized reviewer runs \`dev template deliver <this-pr-number>\`.`,
    },
    run,
  );
  return { ...preview, ...result, id, requestRepository: policy.repository };
}

/** @param {string} root @param {string} number @param {{dryRun?: boolean}} [options] @param {import('./types.d.mts').Runner} [run] */
export async function ciDeliverTemplate(
  root,
  number,
  options = {},
  run = ciRun,
) {
  if (!/^[1-9][0-9]*$/.test(number))
    throw new CiDevUsageError(
      "template deliver requires a positive private PR number.",
    );
  const github = await ciReadGithubPolicy(root);
  const release = await ciReadPolicy(root);
  const policy = {
    ...release,
    repository: github.template.requestRepository ?? release.repository,
  };
  if (!policy.repository)
    throw new CiDevUsageError(
      "Configure the private release repository first.",
    );
  const api = ciGithub(root, run);
  const login = ciStringField(await api("user"), "login");
  if (
    !github.template.reviewers.some(
      (name) => name.toLowerCase() === login.toLowerCase(),
    )
  )
    throw new CiDevUsageError(
      "Only a configured template reviewer may deliver.",
    );
  const pr = await api(`repos/${policy.repository}/pulls/${number}`);
  if (
    !ciIsRecord(pr) ||
    !pr.merged_at ||
    !ciIsRecord(pr.head) ||
    !ciIsRecord(pr.head.repo) ||
    pr.head.repo.full_name !== policy.repository ||
    typeof pr.head.ref !== "string" ||
    !new RegExp(`^${branchPrefix}[a-f0-9]{24}$`).test(pr.head.ref) ||
    !ciIsRecord(pr.base) ||
    pr.base.ref !== policy.baseBranch ||
    !ciIsRecord(pr.user)
  )
    throw new CiDevUsageError(
      "Delivery requires a merged company template request.",
    );
  const headSha = ciSha(pr.head);
  const reviews = await api(
    `repos/${policy.repository}/pulls/${number}/reviews?per_page=100`,
  );
  if (!Array.isArray(reviews) || reviews.length >= 100)
    throw new CiDevUsageError("Cannot verify template approvals.");
  const latest = new Map();
  const requester = ciStringField(pr.user, "login").toLowerCase();
  for (const review of reviews)
    if (
      ciIsRecord(review) &&
      ciIsRecord(review.user) &&
      typeof review.user.login === "string" &&
      review.state !== "COMMENTED"
    )
      latest.set(review.user.login.toLowerCase(), review);
  if (
    ![...latest].some(
      ([user, review]) =>
        user !== requester &&
        github.template.reviewers.some((name) => name.toLowerCase() === user) &&
        review.state === "APPROVED" &&
        review.commit_id === headSha,
    )
  )
    throw new CiDevUsageError(
      "The current request commit needs approval by another configured template reviewer.",
    );
  const id = pr.head.ref.slice(branchPrefix.length);
  const file = await api(
    `repos/${policy.repository}/contents/.cloudigniter/template-releases/${id}.json?ref=${headSha}`,
  );
  if (
    !ciIsRecord(file) ||
    file.encoding !== "base64" ||
    typeof file.content !== "string"
  )
    throw new Error("Invalid approved request file.");
  const request = JSON.parse(
    Buffer.from(file.content, "base64").toString("utf8"),
  );
  if (
    !ciIsRecord(request) ||
    request.schemaVersion !== 1 ||
    ciDigest(request).slice(0, 24) !== id ||
    request.destination !== github.template.repository ||
    typeof request.sourceCommit !== "string" ||
    !/^[a-f0-9]{40}$/.test(request.sourceCommit) ||
    typeof request.source !== "string" ||
    typeof request.policy !== "string" ||
    typeof request.name !== "string" ||
    typeof request.digest !== "string" ||
    typeof request.summary !== "string" ||
    (request.packageVersion !== null &&
      typeof request.packageVersion !== "string")
  )
    throw new CiDevUsageError(
      "Approved template request is invalid or destination settings changed.",
    );
  await ciCleanBase(root, policy.baseBranch, run);
  await run(
    "git",
    ["merge-base", "--is-ancestor", request.sourceCommit, "HEAD"],
    root,
  );
  const selection = {
    source: request.source,
    policy: request.policy,
    name: request.name,
    packageVersion: request.packageVersion ?? undefined,
    summary: request.summary,
  };
  const plan = await ciPlanTemplateExport(root, selection);
  if (plan.digest !== request.digest)
    throw new CiDevUsageError(
      "Current export differs from the approved digest. Submit a new request.",
    );
  if (options.dryRun)
    return {
      status: "approved-preview",
      repository: request.destination,
      digest: plan.digest,
      published: false,
    };
  const output = await mkdtemp(path.join(tmpdir(), "ci-template-delivery-"));
  try {
    for (const [file, bytes] of plan.files) {
      const target = path.join(output, file);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes, { flag: "wx" });
    }
    return await ciPublishCandidate(root, { ...selection, output }, run);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}

/** @param {string} file */
function publicFile(file) {
  if (
    !file ||
    file.includes("\\") ||
    file
      .split("/")
      .some(
        (part) =>
          !part || part === "." || part === ".." || /[\x00-\x1f]/.test(part),
      ) ||
    /^(?:\.git(?:hub)?|\.cloudigniter)(?:\/|$)/i.test(file) ||
    file === manifestPath
  )
    throw new CiDevUsageError(
      "A template request cannot change GitHub governance files or use unsafe paths.",
    );
}

/** @param {string} root
 * @param {import('./template-export.mjs').CiTemplateOptions & {output?: string, dryRun?: boolean, summary?: string}} options
 * @param {import('./types.d.mts').Runner} [run]
 */
async function ciPublishCandidate(root, options, run = ciRun) {
  const github = await ciReadGithubPolicy(root);
  if (!options.output?.trim())
    throw new CiDevUsageError(
      "template publish requires --output=<export-directory>.",
    );
  const requested = path.resolve(options.output);
  const output = path.join(
    await realpath(path.dirname(requested)),
    path.basename(requested),
  );
  const relative = path.relative(await realpath(root), output);
  if (
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  )
    throw new CiDevUsageError(
      "Template publication requires an export outside the private workspace.",
    );
  const plan = await ciPlanTemplateExport(root, options);
  await ciAssertTemplateMatches(output, plan);
  for (const file of plan.files.keys()) publicFile(file);
  const preview = {
    status: "preview",
    repository: github.template.repository,
    baseBranch: github.template.baseBranch,
    name: plan.name,
    digest: plan.digest,
    files: plan.hashes,
    published: false,
  };
  if (options.dryRun) return preview;
  const repository = github.template.repository;
  if (!repository)
    throw new CiDevUsageError(
      "Configure template.repository in .cloudigniter/github-policy.json. No Git remote is inferred.",
    );
  if (
    !options.summary?.trim() ||
    options.summary.length > 4000 ||
    /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(options.summary)
  )
    throw new CiDevUsageError(
      "template publish requires --summary (at most 4000 characters, without terminal controls).",
    );
  const releasePolicy = await ciReadPolicy(root);
  if (
    repository.toLowerCase() ===
    (
      github.template.requestRepository ?? releasePolicy.repository
    )?.toLowerCase()
  )
    throw new CiDevUsageError(
      "The public template repository must differ from the private release repository.",
    );
  const sourceSha = await ciCleanBase(root, releasePolicy.baseBranch, run);
  const api = ciGithub(root, run);
  const login = ciStringField(await api("user"), "login");
  if (
    !github.template.reviewers.some(
      (name) => name.toLowerCase() === login.toLowerCase(),
    )
  )
    throw new CiDevUsageError(
      "Only a configured template reviewer may deliver an approved template.",
    );
  const repoPath = `repos/${repository}`;
  const repo = await api(repoPath);
  if (
    !ciIsRecord(repo) ||
    repo.full_name !== repository ||
    repo.private !== false ||
    repo.archived !== false ||
    !ciIsRecord(repo.permissions) ||
    repo.permissions.push !== true
  )
    throw new CiDevUsageError(
      "Destination must be the configured public, writable, non-archived repository.",
    );
  const baseEndpoint = `${repoPath}/git/ref/heads/${encodeURIComponent(github.template.baseBranch)}`;
  const base = await api(baseEndpoint);
  if (!ciIsRecord(base)) throw new Error("Invalid template base ref.");
  const baseSha = ciSha(base.object);
  const commit = await api(`${repoPath}/git/commits/${baseSha}`);
  if (!ciIsRecord(commit)) throw new Error("Invalid template base commit.");
  const baseTree = ciSha(commit.tree);
  const listing = await api(`${repoPath}/git/trees/${baseTree}?recursive=1`);
  if (
    !ciIsRecord(listing) ||
    listing.truncated !== false ||
    !Array.isArray(listing.tree)
  )
    throw new CiDevUsageError(
      "GitHub returned an incomplete template tree; inspect the repository manually.",
    );
  const entries = listing.tree.filter(ciIsRecord);
  const previous = entries.find((entry) => entry.path === manifestPath);
  /** @type {string[]} */
  let previousFiles = [];
  if (previous) {
    if (previous.type !== "blob" || previous.mode !== "100644")
      throw new CiDevUsageError("Invalid template ownership manifest.");
    const blob = await api(`${repoPath}/git/blobs/${ciSha(previous)}`);
    if (
      !ciIsRecord(blob) ||
      blob.encoding !== "base64" ||
      typeof blob.content !== "string"
    )
      throw new Error("Invalid GitHub manifest blob.");
    const metadata = JSON.parse(
      Buffer.from(blob.content, "base64").toString("utf8"),
    );
    if (
      !ciIsRecord(metadata) ||
      metadata.schemaVersion !== 1 ||
      !Array.isArray(metadata.files) ||
      metadata.files.some((file) => typeof file !== "string")
    )
      throw new CiDevUsageError("Invalid template ownership manifest.");
    previousFiles = metadata.files;
    previousFiles.forEach(publicFile);
  }
  // Recheck every local input and the destination before uploading public bytes.
  if (
    (await ciCleanBase(root, releasePolicy.baseBranch, run)) !== sourceSha ||
    ciDigest(await ciReadGithubPolicy(root)) !== ciDigest(github) ||
    (await ciPlanTemplateExport(root, options)).digest !== plan.digest
  )
    throw new CiDevUsageError(
      "Template inputs changed during preflight. Re-export and retry.",
    );
  await ciAssertTemplateMatches(output, plan);
  const fresh = await api(baseEndpoint);
  if (!ciIsRecord(fresh) || ciSha(fresh.object) !== baseSha)
    throw new CiDevUsageError(
      "Public base branch changed during preflight. Review and retry.",
    );
  /** @type {Array<{path: string, mode: '100644', type: 'blob', content?: string, sha?: string | null}>} */
  const tree = [];
  for (const [file, bytes] of plan.files) {
    const content = bytes.toString("utf8");
    if (Buffer.from(content).equals(bytes))
      tree.push({ path: file, mode: "100644", type: "blob", content });
    else {
      const blob = await api(`${repoPath}/git/blobs`, {
        content: bytes.toString("base64"),
        encoding: "base64",
      });
      tree.push({ path: file, mode: "100644", type: "blob", sha: ciSha(blob) });
    }
  }
  for (const file of previousFiles) {
    if (!plan.files.has(file) && entries.some((entry) => entry.path === file))
      tree.push({ path: file, mode: "100644", type: "blob", sha: null });
  }
  tree.push({
    path: manifestPath,
    mode: "100644",
    type: "blob",
    content: `${JSON.stringify({ schemaVersion: 1, digest: plan.digest, files: [...plan.files.keys()].sort(), versions: plan.versions }, null, 2)}\n`,
  });
  const treeSha = ciSha(
    await api(`${repoPath}/git/trees`, { base_tree: baseTree, tree }),
  );
  if (treeSha === baseTree)
    return {
      ...preview,
      status: "published",
      published: true,
      commit: baseSha,
      reused: true,
    };
  const head = await api(`${repoPath}/git/commits`, {
    message: `chore(template): publish ${plan.name}`,
    tree: treeSha,
    parents: [baseSha],
  });
  // A concurrent update fails as non-fast-forward; never force the public branch.
  await api(
    `${repoPath}/git/refs/heads/${encodeURIComponent(github.template.baseBranch)}`,
    { sha: ciSha(head), force: false },
    "PATCH",
  );
  return {
    ...preview,
    status: "published",
    published: true,
    commit: ciSha(head),
    reused: false,
  };
}

/** @param {string} root @param {string} number @param {import('./types.d.mts').Runner} [run] */
export async function ciTemplateStatus(root, number, run = ciRun) {
  if (!/^[1-9][0-9]*$/.test(number))
    throw new CiDevUsageError("template status requires a positive PR number.");
  const release = await ciReadPolicy(root);
  const github = await ciReadGithubPolicy(root);
  const template = {
    ...release,
    repository: github.template.requestRepository ?? release.repository,
  };
  if (!template.repository)
    throw new CiDevUsageError("Configure release-policy.repository first.");
  const pr = await ciGithub(
    root,
    run,
  )(`repos/${template.repository}/pulls/${number}`);
  if (
    !ciIsRecord(pr) ||
    !ciIsRecord(pr.head) ||
    !ciIsRecord(pr.head.repo) ||
    pr.head.repo.full_name !== template.repository ||
    typeof pr.head.ref !== "string" ||
    !pr.head.ref.startsWith(branchPrefix) ||
    !ciIsRecord(pr.base) ||
    pr.base.ref !== template.baseBranch
  )
    throw new CiDevUsageError(
      "This PR is not a template request for the configured repository.",
    );
  return {
    number: Number(number),
    url: ciPullUrl(pr, template.repository),
    status: pr.merged_at
      ? "request-merged"
      : pr.state === "closed"
        ? "request-closed"
        : "request-open",
    npmPublication: "unverified",
  };
}
