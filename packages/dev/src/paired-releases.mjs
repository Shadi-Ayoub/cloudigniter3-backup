import path from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { getPackages } from "@manypkg/get-packages";
import {
  readFile,
  writeFile,
  mkdir,
  mkdtemp,
  cp,
  copyFile,
  symlink,
  rm,
  lstat,
  realpath,
} from "node:fs/promises";
import { ciReadPolicy, ciReadJson, ciIsRecord } from "./policy.mjs";
import {
  ciCreateReleasePlan,
  ciDigest,
  ciSerializeChangeset,
} from "./release-plan.mjs";
import { ciAuthorizeRequester } from "./github-policy.mjs";
import { ciGithub, ciCleanBase, ciSha, ciStringField } from "./github-api.mjs";
import { ciCheckRepository } from "./repositories.mjs";
import { ciCreateReviewRequest } from "./github-request.mjs";
import { ciRun, CiDevUsageError, ciErrorMessage } from "./runtime.mjs";

/** @param {Buffer} bytes */
export function ciBlobHash(bytes) {
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

/** @param {string} file */
function sourceFile(file) {
  return (
    file &&
    !file.includes("\\") &&
    !file
      .split("/")
      .some(
        (part) =>
          !part ||
          part === "." ||
          part === ".." ||
          /[\x00-\x1f]/.test(part) ||
          /^(?:\.git(?:hub)?|\.cloudigniter|\.cloudigniter-source\.json|node_modules|dist|coverage|\.turbo|\.next)$/.test(
            part
          ) ||
          part.startsWith("._") ||
          /^\.env(?:\.|$)/.test(part) ||
          part === ".npmrc"
      )
  );
}

/** @param {string} root @param {string} directory @param {import('./types.d.mts').Runner} run */
export async function ciPackageSourceFiles(root, directory, run) {
  const parent = await realpath(path.join(root, directory));
  const names = (
    await run("git", ["ls-files", "-z", "--", `${directory}/`], root)
  )
    .split("\0")
    .filter(Boolean);
  /** @type {Map<string, Buffer>} */
  const files = new Map();
  for (const name of names.sort()) {
    if (!name.startsWith(directory + "/"))
      throw new CiDevUsageError("Unexpected tracked package path.");
    const file = name.slice(directory.length + 1);
    if (!sourceFile(file)) continue;
    const full = path.join(parent, file);
    if (
      !(await lstat(full)).isFile() ||
      !(await realpath(full)).startsWith(parent + path.sep)
    )
      throw new CiDevUsageError(
        "Package source must contain regular confined files."
      );
    const bytes = await readFile(full);
    if (bytes.length > 50 * 1024 * 1024)
      throw new CiDevUsageError(
        "Source file exceeds the supported GitHub upload limit."
      );
    files.set(file, bytes);
  }
  if (!files.has("package.json"))
    throw new CiDevUsageError(
      "Commit package source before requesting publication."
    );
  return files;
}

/** Run the existing Changesets CLI in an isolated metadata workspace.
 * @param {string} root @param {import('./types.d.mts').ReleaseProposal} plan @param {import('./types.d.mts').Runner} run
 */
export async function ciPreviewVersionFiles(root, plan, run) {
  const temporary = await mkdtemp(path.join(tmpdir(), "ci-reviewed-versions-"));
  try {
    const workspace = await getPackages(root);
    await copyFile(
      path.join(root, "package.json"),
      path.join(temporary, "package.json")
    );
    await copyFile(
      path.join(root, "pnpm-workspace.yaml"),
      path.join(temporary, "pnpm-workspace.yaml")
    );
    await cp(
      path.join(root, ".changeset"),
      path.join(temporary, ".changeset"),
      { recursive: true, dereference: false }
    );
    await symlink(
      path.join(root, "node_modules"),
      path.join(temporary, "node_modules"),
      "dir"
    );
    for (const pkg of workspace.packages) {
      const target = path.join(temporary, path.relative(root, pkg.dir));
      await mkdir(target, { recursive: true });
      await copyFile(
        path.join(pkg.dir, "package.json"),
        path.join(target, "package.json")
      );
      try {
        await copyFile(
          path.join(pkg.dir, "CHANGELOG.md"),
          path.join(target, "CHANGELOG.md")
        );
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          error.code !== "ENOENT"
        )
          throw error;
      }
    }
    if (plan.newChangeset)
      await writeFile(
        path.join(temporary, ".changeset", `${plan.newChangeset.id}.md`),
        ciSerializeChangeset(plan.newChangeset),
        { flag: "wx" }
      );
    if (plan.enterPreState)
      await writeFile(
        path.join(temporary, ".changeset/pre.json"),
        JSON.stringify(plan.enterPreState)
      );
    await run("pnpm", ["exec", "changeset", "version"], temporary);
    /** @type {Map<string, Map<string, Buffer>>} */
    const changes = new Map();
    for (const release of plan.releases) {
      const dir = path.join(temporary, release.path);
      const manifest = await readFile(path.join(dir, "package.json"));
      if (JSON.parse(manifest.toString()).version !== release.newVersion)
        throw new Error("Changesets produced an unexpected candidate version.");
      const files = new Map([["package.json", manifest]]);
      try {
        files.set(
          "CHANGELOG.md",
          await readFile(path.join(dir, "CHANGELOG.md"))
        );
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          error.code !== "ENOENT"
        )
          throw error;
      }
      changes.set(release.name, files);
    }
    return changes;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

/** @param {string} root @param {import('./types.d.mts').PlanOptions} options @param {import('./types.d.mts').Runner} [run] */
export async function ciSubmitPairedRelease(root, options, run = ciRun) {
  const policy = await ciReadPolicy(root);
  const baseCommit = await ciCleanBase(root, policy.baseBranch, run);
  const plan = await ciCreateReleasePlan(root, options);
  const api = ciGithub(root, run);
  const login = ciStringField(await api("user"), "login");
  await ciAuthorizeRequester(root, login);
  const reviewers = policy.reviewers.filter(
    (name) => name.toLowerCase() !== login.toLowerCase()
  );
  if (!reviewers.length || reviewers.some((name) => name.includes("/")))
    throw new CiDevUsageError(
      "Paired releases require another individual reviewer."
    );
  if (!plan.summary.trim())
    throw new CiDevUsageError(
      "Describe this release using --summary or pending Changesets."
    );
  const versionFiles = await ciPreviewVersionFiles(root, plan, run);
  /** @type {Map<string, Map<string, Buffer>>} */
  const snapshots = new Map();
  /** @type {Record<string, {repository:string, buildRepository:string, files:Record<string,string>}>} */
  const sources = {};
  const bases = new Map();
  for (const release of plan.releases) {
    const entry = policy.packages[release.name];
    if (!entry.sourceRepository || !entry.buildRepository)
      throw new CiDevUsageError("Missing package repository pair.");
    await ciCheckRepository(root, entry.sourceRepository, true, run);
    const ref = await api(
      `repos/${entry.sourceRepository}/git/ref/heads/${encodeURIComponent(
        policy.baseBranch
      )}`
    );
    if (!ciIsRecord(ref)) throw new Error("Invalid source branch.");
    bases.set(release.name, ciSha(ref.object));
    const files = await ciPackageSourceFiles(root, release.path, run);
    for (const [name, bytes] of versionFiles.get(release.name) ?? [])
      files.set(name, bytes);
    snapshots.set(release.name, files);
    sources[release.name] = {
      repository: entry.sourceRepository,
      buildRepository: entry.buildRepository,
      files: Object.fromEntries(
        [...files]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, bytes]) => [name, ciBlobHash(bytes)])
      ),
    };
  }
  const request = { schemaVersion: 1, baseCommit, reviewers, plan, sources };
  const id = ciDigest(request).slice(0, 24);
  if (
    (await ciCleanBase(root, policy.baseBranch, run)) !== baseCommit ||
    ciDigest(await ciReadPolicy(root)) !== ciDigest(policy)
  )
    throw new CiDevUsageError("Release inputs changed during preparation.");
  const requests = [];
  try {
    for (const release of plan.releases) {
      const source = sources[release.name];
      const files = snapshots.get(release.name);
      if (!files) throw new Error("Missing prepared source files.");
      /** @type {Array<{path:string, content?:string, sha?:string|null}>} */
      const tree = [];
      for (const [name, bytes] of files) {
        const content = bytes.toString("utf8");
        if (Buffer.from(content).equals(bytes))
          tree.push({ path: name, content });
        else
          tree.push({
            path: name,
            sha: ciSha(
              await api(`repos/${source.repository}/git/blobs`, {
                content: bytes.toString("base64"),
                encoding: "base64",
              })
            ),
          });
      }
      // Delete only previously managed source files; keep repository governance.
      try {
        const prior = await api(
          `repos/${
            source.repository
          }/contents/.cloudigniter-source.json?ref=${bases.get(release.name)}`
        );
        if (
          !ciIsRecord(prior) ||
          typeof prior.content !== "string" ||
          prior.encoding !== "base64"
        )
          throw new Error("Invalid source ownership manifest.");
        const owned = JSON.parse(
          Buffer.from(prior.content, "base64").toString()
        );
        if (
          !ciIsRecord(owned) ||
          owned.schemaVersion !== 1 ||
          !Array.isArray(owned.files) ||
          owned.files.some(
            (file) => typeof file !== "string" || !sourceFile(file)
          )
        )
          throw new CiDevUsageError("Invalid source ownership inventory.");
        for (const name of owned.files)
          if (!files.has(name)) tree.push({ path: name, sha: null });
      } catch (error) {
        if (!/HTTP 404/.test(ciErrorMessage(error))) throw error;
      }
      tree.push({
        path: ".cloudigniter-source.json",
        content:
          JSON.stringify(
            { schemaVersion: 1, files: [...files.keys()].sort() },
            null,
            2
          ) + "\n",
      });
      tree.push({
        path: `.cloudigniter/releases/${id}.json`,
        content: JSON.stringify(request, null, 2) + "\n",
      });
      const result = await ciCreateReviewRequest(
        root,
        {
          repository: source.repository,
          baseBranch: policy.baseBranch,
          baseSha: String(bases.get(release.name)),
          branch: `release/cloudigniter/${id}`,
          prefix: "release/cloudigniter/",
          files: tree,
          title: `chore(release): ${release.name}@${release.newVersion}`,
          reviewers,
          body: `${plan.summary}\n\nRelease request: \`${id}\`\nBuild destination: ${source.buildRepository}\n\nReview the concrete source, versions and changelog. Merge every source PR in this request before building. This request does not publish to npm.`,
        },
        run
      );
      requests.push({
        package: release.name,
        repository: source.repository,
        ...result,
      });
    }
  } catch (error) {
    throw new Error(
      `Paired request stopped after ${
        requests.length
      } source PR(s). Inspect existing branches before retrying the identical request. ${ciErrorMessage(
        error
      )}`
    );
  }
  return {
    status: "awaiting-review",
    id,
    plan,
    requests,
    url: requests.map((request) => request.url).join("\n"),
    reused: requests.every((request) => request.reused),
    published: false,
  };
}

/** @param {string} root @param {string} repository @param {string} branch @param {string} baseBranch @param {string[]} reviewers @param {import('./types.d.mts').Runner} run */
async function approvedRequest(
  root,
  repository,
  branch,
  baseBranch,
  reviewers,
  run
) {
  const api = ciGithub(root, run);
  const owner = repository.split("/")[0];
  const pulls = await api(
    `repos/${repository}/pulls?state=closed&head=${encodeURIComponent(
      `${owner}:${branch}`
    )}&per_page=100`
  );
  if (!Array.isArray(pulls) || pulls.length >= 100)
    throw new CiDevUsageError("Cannot verify source review.");
  const pr = pulls.find(
    (item) =>
      ciIsRecord(item) &&
      item.merged_at &&
      ciIsRecord(item.head) &&
      item.head.ref === branch
  );
  if (
    !ciIsRecord(pr) ||
    !ciIsRecord(pr.head) ||
    !ciIsRecord(pr.head.repo) ||
    pr.head.repo.full_name !== repository ||
    !ciIsRecord(pr.base) ||
    pr.base.ref !== baseBranch ||
    !ciIsRecord(pr.user) ||
    typeof pr.number !== "number"
  )
    throw new CiDevUsageError(
      `Merge the reviewed request in ${repository} before continuing.`
    );
  const head = ciSha(pr.head);
  const author = ciStringField(pr.user, "login").toLowerCase();
  const history = await api(
    `repos/${repository}/pulls/${pr.number}/reviews?per_page=100`
  );
  if (!Array.isArray(history) || history.length >= 100)
    throw new CiDevUsageError("Cannot verify source approvals.");
  const latest = new Map();
  for (const review of history)
    if (
      ciIsRecord(review) &&
      ciIsRecord(review.user) &&
      typeof review.user.login === "string" &&
      review.state !== "COMMENTED"
    )
      latest.set(review.user.login.toLowerCase(), review);
  if (
    ![...latest].some(
      ([login, review]) =>
        login !== author &&
        reviewers.some((name) => name.toLowerCase() === login) &&
        review.state === "APPROVED" &&
        review.commit_id === head
    )
  )
    throw new CiDevUsageError(
      "Source request needs another configured approver's review of its exact commit."
    );
  return { number: pr.number, head };
}

/** Fetch consistent approved metadata from the package source repositories.
 * @param {string} root @param {string} id @param {import('./types.d.mts').ReleasePolicy} policy @param {import('./types.d.mts').Runner} run
 * @returns {Promise<Record<string, unknown>>}
 */
export async function ciReadPairedRequest(root, id, policy, run) {
  const api = ciGithub(root, run);
  let raw;
  for (const entry of Object.values(policy.packages)) {
    if (!entry.sourceRepository) continue;
    try {
      const content = await api(
        `repos/${
          entry.sourceRepository
        }/contents/.cloudigniter/releases/${id}.json?ref=${encodeURIComponent(
          policy.baseBranch
        )}`
      );
      if (
        !ciIsRecord(content) ||
        content.encoding !== "base64" ||
        typeof content.content !== "string"
      )
        throw new Error("Invalid request content.");
      raw = JSON.parse(Buffer.from(content.content, "base64").toString());
      break;
    } catch (error) {
      if (!/HTTP 404/.test(ciErrorMessage(error))) throw error;
    }
  }
  if (
    !ciIsRecord(raw) ||
    ciDigest(raw).slice(0, 24) !== id ||
    !ciIsRecord(raw.sources)
  )
    throw new CiDevUsageError(
      "No valid merged paired release request was found."
    );
  for (const [name, source] of Object.entries(raw.sources)) {
    const entry = policy.packages[name];
    if (
      !entry ||
      !ciIsRecord(source) ||
      source.repository !== entry.sourceRepository ||
      source.buildRepository !== entry.buildRepository ||
      !ciIsRecord(source.files)
    )
      throw new CiDevUsageError(
        "Source request repository mapping has changed."
      );
    const approval = await approvedRequest(
      root,
      String(source.repository),
      `release/cloudigniter/${id}`,
      policy.baseBranch,
      policy.reviewers,
      run
    );
    const record = await api(
      `repos/${source.repository}/contents/.cloudigniter/releases/${id}.json?ref=${approval.head}`
    );
    if (
      !ciIsRecord(record) ||
      record.encoding !== "base64" ||
      typeof record.content !== "string" ||
      ciDigest(
        JSON.parse(Buffer.from(record.content, "base64").toString())
      ).slice(0, 24) !== id
    )
      throw new CiDevUsageError("Approved source requests disagree.");
    const listing = await api(
      `repos/${source.repository}/git/trees/${approval.head}?recursive=1`
    );
    if (
      !ciIsRecord(listing) ||
      listing.truncated !== false ||
      !Array.isArray(listing.tree)
    )
      throw new CiDevUsageError("Cannot verify approved source inventory.");
    for (const [file, sha] of Object.entries(source.files)) {
      if (
        !sourceFile(file) ||
        typeof sha !== "string" ||
        !listing.tree.some(
          (item) =>
            ciIsRecord(item) &&
            item.path === file &&
            item.type === "blob" &&
            item.sha === sha
        )
      )
        throw new CiDevUsageError(
          "Approved source files differ from the recorded request."
        );
    }
  }
  return raw;
}
