import { createHash } from "node:crypto";
import { ciIsRecord, ciValidateRepositories } from "./repository-config.mjs";
import { ciMirrorGit } from "./source-mirror-git.mjs";

/** @typedef {Record<string, {mode: string, blob: string}>} MirrorFiles */
/** @typedef {(endpoint: string) => Promise<unknown>} MirrorApi */
/** @typedef {(args: string[], cwd: string, input?: string, env?: NodeJS.ProcessEnv) => Promise<string>} MirrorGit */
/** @typedef {{workspaceRepository:string, baseBranch:string, reviewers:string[], checkAppId:number, qualityWorkflows:{path:string, checks:string[]}[]}} MirrorPolicy */
/** @typedef {{status:'authorized', workspaceRepository:string, workspaceCommit:string, pullRequest:{number:number, headCommit:string, mergeCommit:string, approvedBy:string[]}, checks:{name:string,runId:number,url:string}[]} | {status:'waiting'|'superseded', workspaceCommit:string}} MirrorAuthorization */

/** @param {unknown} value @returns {value is string} */
export function ciMirrorSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

/** @param {string} file */
export function ciMirrorSourceFile(file) {
  return (
    file.length > 0 &&
    !file.includes("\\") &&
    !/[\x00-\x1f\x7f]/.test(file) &&
    !file
      .split("/")
      .some(
        (part) =>
          !part ||
          part === "." ||
          part === ".." ||
          part.startsWith("._") ||
          /^(?:\.git|\.github|\.cloudigniter|\.cloudigniter-(?:source|mirror)\.json|\.DS_Store|\.npmrc|node_modules|dist|coverage|\.turbo|\.next|\.docusaurus|\.logs|\.amplify)$/.test(
            part,
          ) ||
          /^\.env(?:\.|$)/.test(part),
      ) &&
    !/^(?:build|\.generated)(?:\/|$)/.test(file) &&
    !/^amplify_outputs(?:\..*)?\.json$/.test(file)
  );
}

/** Read committed inputs; local edits and generated outputs never enter a mirror.
 * @param {string} root @param {string} sha @param {MirrorGit} [git]
 */
export async function ciMirrorConfiguration(root, sha, git = ciMirrorGit) {
  if (!ciMirrorSha(sha)) throw new Error("Invalid workspace commit.");
  /** @param {string} file @returns {Promise<unknown>} */
  const read = async (file) =>
    JSON.parse(await git(["show", `${sha}:${file}`], root));
  const inventory = ciValidateRepositories(
    await read(".cloudigniter/repositories.json"),
  );
  const raw = await read(".cloudigniter/source-mirroring.json");
  const github = await read(".cloudigniter/github-policy.json");
  const release = await read(".cloudigniter/release-policy.json");
  if (
    !ciIsRecord(raw) ||
    raw.schemaVersion !== 1 ||
    Object.keys(raw).some(
      (key) =>
        ![
          "schemaVersion",
          "workspaceRepository",
          "checkAppId",
          "qualityWorkflows",
        ].includes(key),
    ) ||
    typeof raw.workspaceRepository !== "string" ||
    !/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9._-]*$/i.test(
      raw.workspaceRepository,
    ) ||
    !ciIsRecord(github) ||
    github.workspaceRepository !== raw.workspaceRepository ||
    !ciIsRecord(release) ||
    release.baseBranch !== inventory.baseBranch ||
    !Array.isArray(release.reviewers) ||
    !release.reviewers.length ||
    release.reviewers.some(
      (name) => typeof name !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(name),
    ) ||
    raw.checkAppId !== 15368 ||
    !Array.isArray(raw.qualityWorkflows) ||
    !raw.qualityWorkflows.length
  )
    throw new Error(
      "Invalid source-mirroring policy or inconsistent company routing.",
    );
  /** @type {MirrorPolicy['qualityWorkflows']} */
  const qualityWorkflows = [];
  const names = new Set(),
    paths = new Set();
  for (const item of raw.qualityWorkflows) {
    if (
      !ciIsRecord(item) ||
      Object.keys(item).some((key) => !["path", "checks"].includes(key)) ||
      typeof item.path !== "string" ||
      !/^\.github\/workflows\/[a-z0-9-]+\.yml$/.test(item.path) ||
      paths.has(item.path) ||
      !Array.isArray(item.checks) ||
      !item.checks.length ||
      item.checks.some(
        (name) =>
          typeof name !== "string" ||
          !name.trim() ||
          /[\r\n]/.test(name) ||
          names.has(name),
      )
    )
      throw new Error("Invalid or duplicate source-mirroring quality checks.");
    paths.add(item.path);
    const checks = item.checks.map(String);
    for (const name of checks) {
      if (names.has(name)) throw new Error("Duplicate quality check.");
      names.add(name);
    }
    qualityWorkflows.push({ path: item.path, checks });
  }
  const owner = raw.workspaceRepository.split("/")[0];
  for (const project of Object.values(inventory.projects)) {
    if (
      project.sourcePath &&
      project.sourceRepository &&
      (project.sourceRepository === raw.workspaceRepository ||
        project.sourceRepository.split("/")[0] !== owner)
    )
      throw new Error(
        "Source mirrors must be distinct repositories in the company organization.",
      );
  }
  return {
    inventory,
    policy: {
      workspaceRepository: raw.workspaceRepository,
      baseBranch: inventory.baseBranch,
      reviewers: release.reviewers.map(String),
      checkAppId: raw.checkAppId,
      qualityWorkflows,
    },
  };
}

/** Bounded, complete listings; never silently accept truncated evidence.
 * @param {MirrorApi} api @param {string} endpoint @param {string} [field]
 */
async function list(api, endpoint, field) {
  /** @type {unknown[]} */
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const raw = await api(
      `${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
    );
    const values = field && ciIsRecord(raw) ? raw[field] : raw;
    if (!Array.isArray(values))
      throw new Error("Incomplete GitHub evidence listing.");
    all.push(...values);
    if (values.length < 100) {
      if (all.some((value) => !ciIsRecord(value)))
        throw new Error("Malformed GitHub evidence listing.");
      return all.filter(ciIsRecord);
    }
  }
  throw new Error("GitHub evidence exceeds the supported listing limit.");
}

/** @param {MirrorPolicy} policy @param {string} sha @param {MirrorApi} api @returns {Promise<MirrorAuthorization>} */
export async function ciMirrorAuthorization(policy, sha, api) {
  if (!ciMirrorSha(sha)) throw new Error("Invalid workspace commit.");
  const prefix = `repos/${policy.workspaceRepository}`;
  const repo = await api(prefix);
  if (
    !ciIsRecord(repo) ||
    repo.full_name !== policy.workspaceRepository ||
    repo.private !== true ||
    repo.archived !== false ||
    repo.default_branch !== policy.baseBranch
  )
    throw new Error(
      "Canonical repository identity, visibility or base branch differs from policy.",
    );
  const branch = await api(
    `${prefix}/branches/${encodeURIComponent(policy.baseBranch)}`,
  );
  if (
    !ciIsRecord(branch) ||
    !ciIsRecord(branch.commit) ||
    branch.protected !== true
  )
    throw new Error("The canonical base branch must be protected.");
  if (branch.commit.sha !== sha)
    return { status: "superseded", workspaceCommit: sha };
  const pulls = await list(api, `${prefix}/commits/${sha}/pulls`);
  const pull = pulls.find(
    (p) =>
      p.merge_commit_sha === sha &&
      p.state === "closed" &&
      p.draft === false &&
      typeof p.merged_at === "string" &&
      ciIsRecord(p.base) &&
      p.base.ref === policy.baseBranch &&
      ciIsRecord(p.base.repo) &&
      p.base.repo.full_name === policy.workspaceRepository,
  );
  if (
    !pull ||
    !Number.isSafeInteger(pull.number) ||
    Number(pull.number) <= 0 ||
    !ciIsRecord(pull.head) ||
    !ciMirrorSha(pull.head.sha) ||
    !ciIsRecord(pull.user) ||
    typeof pull.user.login !== "string"
  )
    throw new Error(
      "The current workspace commit must come from a merged company PR.",
    );
  const head = pull.head.sha,
    author = pull.user.login.toLowerCase();
  const reviews = await list(api, `${prefix}/pulls/${pull.number}/reviews`);
  const latest = new Map();
  for (const review of reviews.sort((a, b) => Number(a.id) - Number(b.id))) {
    if (
      !ciIsRecord(review.user) ||
      typeof review.user.login !== "string" ||
      !Number.isSafeInteger(review.id) ||
      ![
        "APPROVED",
        "CHANGES_REQUESTED",
        "DISMISSED",
        "COMMENTED",
        "PENDING",
      ].includes(String(review.state))
    )
      throw new Error("Malformed GitHub review evidence.");
    if (review.user.type !== "User") continue;
    if (
      ["APPROVED", "CHANGES_REQUESTED", "DISMISSED"].includes(
        String(review.state),
      )
    )
      latest.set(review.user.login.toLowerCase(), review);
  }
  const approvedBy = policy.reviewers.filter((name) => {
    const review = latest.get(name.toLowerCase());
    return (
      name.toLowerCase() !== author &&
      review?.state === "APPROVED" &&
      review.commit_id === head
    );
  });
  if (!approvedBy.length)
    throw new Error(
      "Independent configured approval of the exact PR head is required for mirroring.",
    );
  const checks = await list(
    api,
    `${prefix}/commits/${sha}/check-runs?filter=latest`,
    "check_runs",
  );
  /** @type {{name:string, runId:number, url:string}[]} */
  const verifiedChecks = [];
  const runs = new Map();
  for (const workflow of policy.qualityWorkflows) {
    for (const name of workflow.checks) {
      const check = checks
        .filter(
          (c) =>
            c.name === name &&
            c.head_sha === sha &&
            ciIsRecord(c.app) &&
            c.app.id === policy.checkAppId,
        )
        .sort((a, b) => Number(b.id) - Number(a.id))[0];
      if (!check || check.status !== "completed")
        return { status: "waiting", workspaceCommit: sha };
      if (check.conclusion !== "success")
        throw new Error(
          `Merged-commit check failed: ${name}. Correct CI and rerun before mirroring.`,
        );
      const url =
        typeof check.details_url === "string" ? check.details_url : "";
      const runId = Number(url.match(/\/actions\/runs\/(\d+)\/job\/\d+$/)?.[1]);
      if (
        !url.startsWith(
          `https://github.com/${policy.workspaceRepository}/actions/runs/`,
        ) ||
        !Number.isSafeInteger(runId) ||
        runId <= 0
      )
        throw new Error("Invalid GitHub Actions check provenance.");
      if (!runs.has(runId))
        runs.set(runId, await api(`${prefix}/actions/runs/${runId}`));
      const run = runs.get(runId);
      if (
        !ciIsRecord(run) ||
        run.id !== runId ||
        run.head_sha !== sha ||
        run.head_branch !== policy.baseBranch ||
        run.event !== "push" ||
        run.path !== workflow.path
      )
        throw new Error(
          "Quality checks must come from the configured push workflows on the merged commit.",
        );
      if (run.status !== "completed")
        return { status: "waiting", workspaceCommit: sha };
      if (run.conclusion !== "success")
        throw new Error("A merged-commit quality workflow failed.");
      verifiedChecks.push({ name, runId, url });
    }
  }
  return {
    status: "authorized",
    workspaceRepository: policy.workspaceRepository,
    workspaceCommit: sha,
    pullRequest: {
      number: Number(pull.number),
      headCommit: head,
      mergeCommit: sha,
      approvedBy,
    },
    checks: verifiedChecks,
  };
}

/** @param {string} root @param {string} sha @param {string} sourcePath @param {MirrorGit} [git] */
export async function ciMirrorSnapshot(
  root,
  sha,
  sourcePath,
  git = ciMirrorGit,
) {
  const listing = await git(
    ["ls-tree", "-r", "-z", "--full-tree", sha, "--", `${sourcePath}/`],
    root,
  );
  /** @type {MirrorFiles} */
  const files = {};
  for (const line of listing.split("\0").filter(Boolean)) {
    const match = /^(\d{6}) (blob|commit) ([a-f0-9]{40})\t([\s\S]+)$/.exec(
      line,
    );
    if (!match || !match[4].startsWith(sourcePath + "/"))
      throw new Error("Unexpected source tree entry.");
    const file = match[4].slice(sourcePath.length + 1);
    if (!ciMirrorSourceFile(file)) continue;
    if (match[2] !== "blob" || !["100644", "100755"].includes(match[1]))
      throw new Error(
        "Source mirrors require regular files; symlinks and submodules are unsupported.",
      );
    Object.defineProperty(files, file, {
      value: { mode: match[1], blob: match[3] },
      enumerable: true,
    });
  }
  return files;
}

/** @param {MirrorFiles} prior @param {MirrorFiles} incoming @param {MirrorFiles} current */
export function ciMirrorDiff(prior, incoming, current) {
  /** @type {{path:string, mode:string, blob:string}[]} */
  const updates = [];
  /** @param {{mode:string, blob:string}|undefined} a @param {{mode:string, blob:string}|undefined} b */
  const same = (a, b) => a?.blob === b?.blob && a?.mode === b?.mode;
  /** @param {MirrorFiles} files @param {string} file */
  const own = (files, file) =>
    Object.hasOwn(files, file) ? files[file] : undefined;
  for (const [file, expected] of Object.entries(prior)) {
    if (
      !same(own(current, file), expected) &&
      !same(own(current, file), own(incoming, file))
    )
      throw new Error(`Destination drift in managed file: ${file}.`);
    if (!own(incoming, file) && own(current, file))
      updates.push({ path: file, mode: "0", blob: "0".repeat(40) });
  }
  for (const [file, value] of Object.entries(incoming)) {
    if (
      !own(prior, file) &&
      own(current, file) &&
      !same(own(current, file), value)
    )
      throw new Error(`Destination collision in unmanaged file: ${file}.`);
    if (!same(own(current, file), value))
      updates.push({ path: file, ...value });
    for (const other of Object.keys(current)) {
      if (
        (other.startsWith(file + "/") || file.startsWith(other + "/")) &&
        !own(prior, other)
      )
        throw new Error(`Destination file/directory collision: ${file}.`);
    }
  }
  return updates;
}

/** @param {MirrorFiles} files */
export function ciMirrorDigest(files) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(files).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        ),
      ),
    )
    .digest("hex");
}

/** Validate remote receipt data before it can claim file ownership.
 * @param {unknown} value @returns {MirrorFiles}
 */
export function ciMirrorOwnedFiles(value) {
  if (!ciIsRecord(value))
    throw new Error("Invalid mirror ownership inventory.");
  /** @type {MirrorFiles} */
  const files = {};
  for (const [file, item] of Object.entries(value)) {
    if (
      !ciMirrorSourceFile(file) ||
      !ciIsRecord(item) ||
      !["100644", "100755"].includes(String(item.mode)) ||
      !ciMirrorSha(item.blob) ||
      Object.keys(item).some((key) => !["mode", "blob"].includes(key))
    )
      throw new Error("Invalid mirror ownership inventory.");
    Object.defineProperty(files, file, {
      value: { mode: String(item.mode), blob: item.blob },
      enumerable: true,
    });
  }
  return files;
}

/** @param {string} token @returns {MirrorApi} */
export function ciMirrorApi(token) {
  if (!token) throw new Error("Missing GitHub credential.");
  return async (endpoint) => {
    if (!/^(?:repos|users)\/[a-z0-9._\-/\[\]?=&%]+$/i.test(endpoint))
      throw new Error("Invalid GitHub API endpoint.");
    const response = await fetch(`https://api.github.com/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      redirect: "error",
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(
        `GitHub request failed (HTTP ${response.status}); inspect repository access or retry.`,
      );
    return response.json();
  };
}
