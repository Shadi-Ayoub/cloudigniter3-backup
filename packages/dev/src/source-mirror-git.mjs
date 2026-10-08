import { spawn } from "node:child_process";
import { mkdtemp, mkdir, writeFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ciIsRecord } from "./repository-config.mjs";
import {
  ciMirrorAuthorization,
  ciMirrorConfiguration,
  ciMirrorSnapshot,
  ciMirrorDiff,
  ciMirrorDigest,
  ciMirrorOwnedFiles,
  ciMirrorSha,
} from "./source-mirror.mjs";

/** No shell, hooks, global credential helpers, candidate installs or token arguments.
 * @type {import('./source-mirror.mjs').MirrorGit}
 */
export async function ciMirrorGit(args, cwd, input, extraEnv = {}) {
  /** @type {NodeJS.ProcessEnv} */
  const env = { ...process.env };
  for (const key of Object.keys(env))
    if (
      key.startsWith("GIT_") ||
      ["GH_TOKEN", "GITHUB_TOKEN", "CLOUDIGNITER_MIRROR_TOKEN"].includes(key)
    )
      delete env[key];
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_COUNT: "0",
    GIT_TERMINAL_PROMPT: "0",
  });
  Object.assign(env, extraEnv);
  return new Promise((resolve, reject) => {
    const child = spawn(
      "git",
      [
        "-c",
        "core.hooksPath=/dev/null",
        "-c",
        "credential.helper=",
        "-c",
        "protocol.ext.allow=never",
        ...args,
      ],
      { cwd, env, shell: false, stdio: ["pipe", "pipe", "pipe"] },
    );
    /** @type {Buffer[]} */
    const chunks = [];
    let size = 0;
    const timer = setTimeout(() => child.kill("SIGKILL"), 300000);
    child.stderr.resume();
    child.stdout.on("data", (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024 * 1024) child.kill("SIGKILL");
      else chunks.push(chunk);
    });
    child.stdin.on("error", () => {});
    child.on("error", () => {
      clearTimeout(timer);
      reject(new Error("Git could not start."));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 || size > 64 * 1024 * 1024)
        reject(
          new Error(
            `Git ${args[0]} failed; inspect access, branch protection or a concurrent update. No force push was attempted.`,
          ),
        );
      else {
        try {
          resolve(
            new TextDecoder("utf-8", { fatal: true }).decode(
              Buffer.concat(chunks),
            ),
          );
        } catch {
          reject(
            new Error("Git returned unsupported non-UTF-8 paths or metadata."),
          );
        }
      }
    });
    child.stdin.end(input);
  });
}

/** @param {string} listing @returns {import('./source-mirror.mjs').MirrorFiles} */
function treeFiles(listing) {
  /** @type {import('./source-mirror.mjs').MirrorFiles} */
  const files = {};
  for (const line of listing.split("\0").filter(Boolean)) {
    const match = /^(\d{6}) (blob|commit) ([a-f0-9]{40})\t([\s\S]+)$/.exec(
      line,
    );
    if (!match) throw new Error("Unexpected destination tree entry.");
    Object.defineProperty(files, match[4], {
      value: { mode: match[1], blob: match[3] },
      enumerable: true,
    });
  }
  return files;
}

/** @typedef {Extract<import('./source-mirror.mjs').MirrorAuthorization, {status:'authorized'}>} MirrorProof */
/** @typedef {{id:string, type:string, package?:string, sourcePath:string, sourceRepository:string}} MirrorTarget */

/** Prepare an independent destination commit without modifying a remote or checking out source.
 * @param {string} root @param {string} temporary @param {MirrorTarget} target
 * @param {import('./source-mirror.mjs').MirrorPolicy} policy @param {MirrorProof} proof
 * @param {import('./source-mirror.mjs').MirrorApi} api @param {import('./source-mirror.mjs').MirrorGit} git
 * @param {NodeJS.ProcessEnv} auth
 */
async function prepare(root, temporary, target, policy, proof, api, git, auth) {
  const metadata = await api(`repos/${target.sourceRepository}`);
  if (
    !ciIsRecord(metadata) ||
    metadata.full_name !== target.sourceRepository ||
    metadata.private !== true ||
    metadata.archived !== false ||
    metadata.default_branch !== policy.baseBranch
  )
    throw new Error(
      `Source repository identity, privacy or base differs from policy: ${target.id}.`,
    );
  const incoming = await ciMirrorSnapshot(
    root,
    proof.workspaceCommit,
    target.sourcePath,
    git,
  );
  if (!Object.keys(incoming).length)
    throw new Error(
      `Mapped source root contains no supported committed files: ${target.id}.`,
    );
  if (target.type === "package") {
    const pkg = JSON.parse(
      await git(
        ["show", `${proof.workspaceCommit}:${target.sourcePath}/package.json`],
        root,
      ),
    );
    if (pkg.name !== target.package)
      throw new Error(
        `Source package identity differs from inventory: ${target.id}.`,
      );
  }
  const directory = path.join(temporary, target.id);
  await mkdir(directory);
  await git(["init", "--bare", "."], directory);
  const objects = await realpath(
    path.resolve(
      root,
      (await git(["rev-parse", "--git-path", "objects"], root)).trim(),
    ),
  );
  if (/[\r\n]/.test(objects))
    throw new Error("Unsupported workspace object path.");
  await writeFile(
    path.join(directory, "objects/info/alternates"),
    objects + "\n",
  );
  const url = `https://github.com/${target.sourceRepository}.git`;
  const refs = (
    await git(
      ["ls-remote", "--heads", "--tags", url],
      directory,
      undefined,
      auth,
    )
  ).trim();
  const ref = refs
    .split("\n")
    .find((line) => line.endsWith(`\trefs/heads/${policy.baseBranch}`));
  if (refs && !ref)
    throw new Error(
      `Source repository has history but no configured base branch: ${target.id}.`,
    );
  let baseCommit = "";
  /** @type {import('./source-mirror.mjs').MirrorFiles} */
  let current = {};
  /** @type {import('./source-mirror.mjs').MirrorFiles} */
  let prior = {};
  /** @type {unknown} */
  let receipt;
  if (ref) {
    baseCommit = ref.split("\t")[0];
    if (!ciMirrorSha(baseCommit))
      throw new Error("Unexpected destination branch identifier.");
    await git(
      ["fetch", "--no-tags", url, `refs/heads/${policy.baseBranch}`],
      directory,
      undefined,
      auth,
    );
    if (
      (await git(["rev-parse", "FETCH_HEAD"], directory)).trim() !== baseCommit
    )
      throw new Error(
        `Destination advanced during preparation: ${target.id}. Retry against the new head.`,
      );
    current = treeFiles(
      await git(["ls-tree", "-r", "-z", baseCommit], directory),
    );
    if (current[".cloudigniter-mirror.json"]) {
      if (current[".cloudigniter-mirror.json"].mode !== "100644")
        throw new Error("The mirror receipt must be a regular managed file.");
      receipt = JSON.parse(
        await git(
          ["show", `${baseCommit}:.cloudigniter-mirror.json`],
          directory,
        ),
      );
      if (
        !ciIsRecord(receipt) ||
        receipt.schemaVersion !== 1 ||
        receipt.kind !== "cloudigniter-source-mirror" ||
        receipt.project !== target.id ||
        receipt.workspaceRepository !== policy.workspaceRepository ||
        receipt.sourceRepository !== target.sourceRepository ||
        !ciMirrorSha(receipt.workspaceCommit) ||
        !ciIsRecord(receipt.files)
      )
        throw new Error("Mirror receipt identity or ownership is invalid.");
      try {
        await git(
          [
            "merge-base",
            "--is-ancestor",
            receipt.workspaceCommit,
            proof.workspaceCommit,
          ],
          root,
        );
      } catch {
        throw new Error(
          "Mirror receipt is outside current canonical history; refusing replay or rollback.",
        );
      }
      const historical = await ciMirrorConfiguration(
        root,
        receipt.workspaceCommit,
        git,
      );
      const priorProject = historical.inventory.projects[target.id];
      if (
        !priorProject?.sourcePath ||
        priorProject.sourcePath !== receipt.sourcePath ||
        priorProject.sourceRepository !== target.sourceRepository
      )
        throw new Error(
          "Mirror receipt identity differs from its recorded canonical repository mapping.",
        );
      prior = await ciMirrorSnapshot(
        root,
        receipt.workspaceCommit,
        priorProject.sourcePath,
        git,
      );
      if (
        ciMirrorDigest(prior) !== receipt.inventorySha256 ||
        ciMirrorDigest(prior) !==
          ciMirrorDigest(ciMirrorOwnedFiles(receipt.files))
      )
        throw new Error(
          "Mirror ownership differs from its recorded canonical source snapshot.",
        );
    }
    await git(["read-tree", baseCommit], directory);
  } else await git(["read-tree", "--empty"], directory);
  const changes = ciMirrorDiff(prior, incoming, current);
  if (
    ciIsRecord(receipt) &&
    receipt.sourcePath === target.sourcePath &&
    !changes.length &&
    ciMirrorDigest(prior) === ciMirrorDigest(incoming)
  )
    return {
      target,
      directory,
      url,
      baseCommit,
      commit: baseCommit,
      status: "unchanged",
      files: Object.keys(incoming).length,
    };
  const next = {
    schemaVersion: 1,
    kind: "cloudigniter-source-mirror",
    project: target.id,
    workspaceRepository: policy.workspaceRepository,
    sourceRepository: target.sourceRepository,
    sourcePath: target.sourcePath,
    workspaceCommit: proof.workspaceCommit,
    previousWorkspaceCommit: ciIsRecord(receipt)
      ? receipt.workspaceCommit
      : null,
    pullRequest: proof.pullRequest,
    checks: proof.checks,
    inventorySha256: ciMirrorDigest(incoming),
    files: incoming,
  };
  const blob = (
    await git(
      ["hash-object", "-w", "--stdin"],
      directory,
      JSON.stringify(next, null, 2) + "\n",
    )
  ).trim();
  changes.push({ path: ".cloudigniter-mirror.json", mode: "100644", blob });
  await git(
    ["update-index", "-z", "--index-info"],
    directory,
    changes.map((file) => `${file.mode} ${file.blob}\t${file.path}\0`).join(""),
  );
  const tree = (await git(["write-tree"], directory)).trim();
  const commit = (
    await git(
      ["commit-tree", tree, ...(baseCommit ? ["-p", baseCommit] : [])],
      directory,
      `Mirror ${target.id} from ${policy.workspaceRepository}@${proof.workspaceCommit}\n\nApproved monorepo PR #${proof.pullRequest?.number}\n`,
      {
        GIT_AUTHOR_NAME: "CloudIgniter Source Mirror",
        GIT_AUTHOR_EMAIL: "cloudigniter-source-mirror@users.noreply.github.com",
        GIT_COMMITTER_NAME: "CloudIgniter Source Mirror",
        GIT_COMMITTER_EMAIL:
          "cloudigniter-source-mirror@users.noreply.github.com",
      },
    )
  ).trim();
  if (!ciMirrorSha(commit))
    throw new Error("Unexpected prepared destination commit.");
  return {
    target,
    directory,
    url,
    baseCommit,
    commit,
    status: "prepared",
    files: Object.keys(incoming).length,
  };
}

/** @param {string} root @param {string} sha
 * @param {{readApi:import('./source-mirror.mjs').MirrorApi, destinationApi:import('./source-mirror.mjs').MirrorApi, token:string, git?:import('./source-mirror.mjs').MirrorGit}} options
 */
export async function ciMirrorSources(root, sha, options) {
  const git = options.git ?? ciMirrorGit;
  const { policy, inventory } = await ciMirrorConfiguration(root, sha, git);
  const proof = await ciMirrorAuthorization(policy, sha, options.readApi);
  if (proof.status !== "authorized")
    return {
      status: proof.status,
      workspaceCommit: sha,
      targets: [],
      failed: false,
    };
  if (!options.token)
    throw new Error("A scoped source-mirroring App token is required.");
  const temporary = await mkdtemp(path.join(tmpdir(), "ci-source-mirror-"));
  /** @type {{project:string, repository:string|null, status:string, commit?:string, error?:string}[]} */
  const targets = [];
  const prepared = [];
  const askpass = path.join(temporary, "askpass.sh");
  await writeFile(
    askpass,
    '#!/bin/sh\ncase "$1" in\n  *Username*) printf "%s\\n" "x-access-token" ;;\n  *Password*) printf "%s\\n" "$CLOUDIGNITER_MIRROR_TOKEN" ;;\n  *) exit 1 ;;\nesac\n',
    { mode: 0o700 },
  );
  const auth = {
    GIT_ASKPASS: askpass,
    CLOUDIGNITER_MIRROR_TOKEN: options.token,
  };
  try {
    // Prepare the complete batch before updating any destination.
    for (const [id, project] of Object.entries(inventory.projects).sort(
      ([a], [b]) => a.localeCompare(b),
    )) {
      const item = {
        project: id,
        repository: project.sourceRepository,
        status: "unmapped",
      };
      targets.push(item);
      if (!project.sourcePath || !project.sourceRepository) continue;
      try {
        const candidate = await prepare(
          root,
          temporary,
          {
            id,
            ...project,
            sourcePath: project.sourcePath,
            sourceRepository: project.sourceRepository,
          },
          policy,
          proof,
          options.destinationApi,
          git,
          auth,
        );
        item.status = candidate.status;
        prepared.push(candidate);
      } catch (error) {
        Object.assign(item, {
          status: "blocked",
          error:
            error instanceof Error
              ? error.message
              : "Source preparation failed.",
        });
        return {
          status: "blocked",
          workspaceCommit: sha,
          targets,
          failed: true,
        };
      }
    }
    for (const candidate of prepared) {
      const item = targets.find(
        (target) => target.project === candidate.target.id,
      );
      if (!item) throw new Error("Missing prepared target.");
      if (candidate.status === "unchanged") {
        item.commit = candidate.commit;
        continue;
      }
      try {
        const fresh = await ciMirrorAuthorization(policy, sha, options.readApi);
        if (fresh.status !== "authorized")
          return {
            status: fresh.status,
            workspaceCommit: sha,
            targets,
            failed: fresh.status === "waiting",
          };
        await git(
          [
            "push",
            "--porcelain",
            candidate.url,
            `${candidate.commit}:refs/heads/${policy.baseBranch}`,
          ],
          candidate.directory,
          undefined,
          auth,
        );
        Object.assign(item, { status: "updated", commit: candidate.commit });
      } catch (error) {
        Object.assign(item, {
          status: "failed",
          error:
            error instanceof Error ? error.message : "Source update failed.",
        });
        return {
          status: "partial",
          workspaceCommit: sha,
          targets,
          failed: true,
        };
      }
    }
    return {
      status: "synchronized",
      workspaceCommit: sha,
      targets,
      failed: false,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
