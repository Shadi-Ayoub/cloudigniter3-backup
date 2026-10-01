import path from "node:path";
import { createHash } from "node:crypto";
import {
  readFile,
  writeFile,
  mkdir,
  realpath,
  lstat,
  copyFile,
} from "node:fs/promises";
import semver from "semver";
import { ciReadPolicy, ciReadJson, ciIsRecord } from "./policy.mjs";
import {
  ciCreateReleasePlan,
  ciDigest,
  ciSerializeChangeset,
} from "./release-plan.mjs";
import {
  ciReadPairedRequest,
  ciPackageSourceFiles,
  ciBlobHash,
} from "./paired-releases.mjs";
import { ciCleanBase } from "./github-api.mjs";
import { ciRun, CiDevUsageError } from "./runtime.mjs";

/** @param {string} root @param {string} id @param {import('./types.d.mts').Runner} run */
async function releaseRequest(root, id, run) {
  if (!/^[a-f0-9]{24}$/.test(id))
    throw new CiDevUsageError(
      "--request must be a 24-character release-request ID."
    );
  const policy = await ciReadPolicy(root);
  const raw =
    policy.topology === "paired"
      ? await ciReadPairedRequest(root, id, policy, run)
      : await ciReadJson(
          path.join(root, ".cloudigniter/releases", `${id}.json`)
        );
  if (
    !ciIsRecord(raw) ||
    raw.schemaVersion !== 1 ||
    ciDigest(raw).slice(0, 24) !== id ||
    !ciIsRecord(raw.plan) ||
    raw.plan.repository !== policy.repository ||
    raw.plan.registry !== policy.registry ||
    raw.plan.baseBranch !== policy.baseBranch ||
    typeof raw.plan.tag !== "string" ||
    !policy.tags.includes(raw.plan.tag) ||
    !Array.isArray(raw.plan.releases) ||
    !raw.plan.releases.length ||
    !Array.isArray(raw.plan.changesetIds) ||
    raw.plan.changesetIds.some((value) => typeof value !== "string")
  )
    throw new CiDevUsageError(
      "Release request does not match current approved policy."
    );
  const seen = new Set();
  const tag = raw.plan.tag;
  const releases = raw.plan.releases.map((entry) => {
    if (
      !ciIsRecord(entry) ||
      typeof entry.name !== "string" ||
      seen.has(entry.name) ||
      !policy.packages[entry.name] ||
      entry.path !== policy.packages[entry.name].path ||
      entry.access !== policy.packages[entry.name].access ||
      typeof entry.newVersion !== "string" ||
      semver.valid(entry.newVersion) !== entry.newVersion ||
      typeof entry.oldVersion !== "string"
    )
      throw new CiDevUsageError("Invalid release request package.");
    if (tag === "latest" && semver.prerelease(entry.newVersion))
      throw new CiDevUsageError("Prereleases cannot target latest.");
    seen.add(entry.name);
    return {
      name: entry.name,
      path: String(entry.path),
      access: policy.packages[entry.name].access,
      oldVersion: entry.oldVersion,
      newVersion: entry.newVersion,
    };
  });
  if (
    policy.topology === "paired" &&
    (!ciIsRecord(raw.sources) ||
      Object.keys(raw.sources).length !== releases.length ||
      releases.some(
        (entry) =>
          !ciIsRecord(raw.sources) || !ciIsRecord(raw.sources[entry.name])
      ))
  )
    throw new CiDevUsageError("Paired request source inventory is incomplete.");
  return {
    policy,
    releases,
    tag: raw.plan.tag,
    changesetIds: raw.plan.changesetIds,
    id,
    raw,
  };
}

/** Apply reviewed intent locally; the resulting version/lockfile changes need a PR.
 * @param {string} root @param {string} id @param {boolean} dryRun @param {import('./types.d.mts').Runner} [run]
 */
export async function ciVersionRelease(root, id, dryRun, run = ciRun) {
  const request = await releaseRequest(root, id, run);
  await ciCleanBase(root, request.policy.baseBranch, run);
  const recorded = request.raw.plan;
  if (!ciIsRecord(recorded)) throw new CiDevUsageError("Invalid request plan.");
  const newChangeset = ciIsRecord(recorded.newChangeset)
    ? recorded.newChangeset
    : null;
  const options =
    request.policy.topology === "paired" && newChangeset
      ? {
          intent: String(recorded.intent),
          packages: request.releases
            .filter(
              (release) =>
                Array.isArray(newChangeset.releases) &&
                newChangeset.releases.some(
                  (item) => ciIsRecord(item) && item.name === release.name
                )
            )
            .map((release) => release.name),
          summary: String(recorded.summary),
          tag: request.tag,
          ...(ciIsRecord(recorded.enterPreState)
            ? { preid: String(recorded.enterPreState.tag) }
            : {}),
        }
      : { changed: true, tag: request.tag };
  const plan = await ciCreateReleasePlan(root, options);
  const selected = plan.releases.map(
    ({ name, path, access, oldVersion, newVersion }) => ({
      name,
      path,
      access,
      oldVersion,
      newVersion,
    })
  );
  if (
    ciDigest(selected) !== ciDigest(request.releases) ||
    ciDigest(plan.changesetIds) !== ciDigest(request.changesetIds)
  )
    throw new CiDevUsageError(
      "Pending Changesets differ from the reviewed request."
    );
  if (!dryRun) {
    if (request.policy.topology === "paired" && plan.newChangeset)
      await writeFile(
        path.join(root, ".changeset", `${plan.newChangeset.id}.md`),
        ciSerializeChangeset(plan.newChangeset),
        { flag: "wx" }
      );
    if (request.policy.topology === "paired" && plan.enterPreState)
      await writeFile(
        path.join(root, ".changeset/pre.json"),
        JSON.stringify(plan.enterPreState, null, 2) + "\n"
      );
    await run("pnpm", ["exec", "changeset", "version"], root);
    await run("pnpm", ["install", "--lockfile-only", "--ignore-scripts"], root);
    for (const release of request.releases) {
      const manifest = await ciReadJson(
        path.join(root, release.path, "package.json")
      );
      if (!ciIsRecord(manifest) || manifest.version !== release.newVersion)
        throw new Error(
          "Changesets produced an unexpected version. Review the working tree; no publication occurred."
        );
    }
  }
  return {
    status: dryRun ? "version-preview" : "version-review-required",
    request: id,
    releases: request.releases,
    published: false,
  };
}

/** @param {Buffer} bytes */
function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** @param {Record<string, unknown>} manifest @param {import('./types.d.mts').ReleasePolicy} policy @param {string} access @param {string} tag */
export function assertPublishMetadata(manifest, policy, access, tag) {
  const repository = ciIsRecord(manifest.repository)
    ? manifest.repository.url
    : manifest.repository;
  const expected =
    typeof manifest.name === "string"
      ? policy.packages[manifest.name]?.buildRepository ?? policy.repository
      : policy.repository;
  if (
    !expected ||
    typeof repository !== "string" ||
    repository.replace(/^git\+/, "").replace(/\.git$/, "") !==
      `https://github.com/${expected}`
  )
    throw new CiDevUsageError(
      "Package repository.url must match the configured company release repository for npm trusted publishing."
    );
  if (manifest.publishConfig !== undefined) {
    const config = manifest.publishConfig;
    if (
      !ciIsRecord(config) ||
      (config.registry !== undefined && config.registry !== policy.registry) ||
      (config.access !== undefined && config.access !== access) ||
      (config.tag !== undefined && config.tag !== tag) ||
      config.directory !== undefined
    )
      throw new CiDevUsageError(
        "Packed publishConfig conflicts with the approved registry, access or tag."
      );
  }
}

/** Build reviewed, committed versions and record exact archives for CI staging.
 * @param {string} root @param {string} id @param {string} destination @param {import('./types.d.mts').Runner} [run]
 */
export async function ciBuildCandidate(root, id, destination, run = ciRun) {
  const request = await releaseRequest(root, id, run);
  const sourceCommit = await ciCleanBase(root, request.policy.baseBranch, run);
  if (request.policy.topology === "paired") {
    const sources = request.raw.sources;
    if (!ciIsRecord(sources))
      throw new CiDevUsageError("Missing approved source inventory.");
    for (const entry of request.releases) {
      const source = sources[entry.name];
      if (!ciIsRecord(source) || !ciIsRecord(source.files))
        throw new CiDevUsageError("Invalid approved source inventory.");
      const files = await ciPackageSourceFiles(root, entry.path, run);
      if (
        files.size !== Object.keys(source.files).length ||
        [...files].some(
          ([name, bytes]) =>
            !ciIsRecord(source.files) ||
            source.files[name] !== ciBlobHash(bytes)
        )
      )
        throw new CiDevUsageError(
          "Local package source differs from its approved source PR. Apply reviewed versions, commit and retry."
        );
    }
  }
  const output = path.join(
    await realpath(path.dirname(path.resolve(destination))),
    path.basename(destination)
  );
  const workspace = await realpath(root);
  if (
    output === workspace ||
    output.startsWith(`${workspace}${path.sep}`) ||
    workspace.startsWith(`${output}${path.sep}`)
  )
    throw new CiDevUsageError(
      "Candidate output must be a new directory outside the workspace."
    );
  for (const entry of request.releases) {
    const manifest = await ciReadJson(
      path.join(root, entry.path, "package.json")
    );
    if (
      !ciIsRecord(manifest) ||
      manifest.name !== entry.name ||
      manifest.version !== entry.newVersion ||
      manifest.private === true
    )
      throw new CiDevUsageError(
        "Commit and review the requested versions before building a candidate."
      );
    assertPublishMetadata(manifest, request.policy, entry.access, request.tag);
  }
  await mkdir(output);
  // Build dependencies in pnpm's workspace order; source-only CLI/DEV have no build:prod.
  const filters = request.releases.flatMap((entry) => [
    "--filter",
    `${entry.name}...`,
  ]);
  await run(
    "pnpm",
    ["-r", ...filters, "run", "--if-present", "build:prod"],
    root,
    { timeout: 3_600_000 }
  );
  const packages = [];
  for (const entry of request.releases) {
    const cwd = path.join(root, entry.path);
    const file = `${entry.name.replace(/^@/, "").replace("/", "-")}-${
      entry.newVersion
    }.tgz`;
    if (entry.name === "@cloudigniter/next") {
      await run("pnpm", ["run", "release:check"], cwd, { timeout: 3_600_000 });
      const checked = await ciReadJson(
        path.join(cwd, "coverage/release/package-check.json")
      );
      if (
        !ciIsRecord(checked) ||
        checked.name !== entry.name ||
        checked.version !== entry.newVersion ||
        checked.tarball !== file
      )
        throw new Error(
          "Next release gate produced unexpected archive metadata."
        );
      const source = path.join(cwd, "coverage/release", file);
      if (hash(await readFile(source)) !== checked.sha256)
        throw new Error("Next approved archive hash changed.");
      await copyFile(source, path.join(output, file));
    } else {
      const manifest = await ciReadJson(path.join(cwd, "package.json"));
      if (!ciIsRecord(manifest) || !ciIsRecord(manifest.scripts))
        throw new CiDevUsageError(
          "Package has no configured validation scripts."
        );
      for (const script of ["check", "test", "check:package"]) {
        if (typeof manifest.scripts[script] !== "string")
          throw new CiDevUsageError(
            `${entry.name} requires ${script} before staging.`
          );
        await run("pnpm", ["run", script], cwd, { timeout: 3_600_000 });
      }
      await run("pnpm", ["pack", "--pack-destination", output], cwd);
    }
    const archive = path.join(output, file);
    const packed = JSON.parse(
      await run("tar", ["-xOf", archive, "package/package.json"], root)
    );
    if (
      !ciIsRecord(packed) ||
      packed.name !== entry.name ||
      packed.version !== entry.newVersion ||
      packed.private === true
    )
      throw new Error("Packed manifest differs from the reviewed release.");
    assertPublishMetadata(packed, request.policy, entry.access, request.tag);
    packages.push({
      name: entry.name,
      version: entry.newVersion,
      access: entry.access,
      file,
      sha256: hash(await readFile(archive)),
    });
  }
  const manifest = {
    schemaVersion: 1,
    request: id,
    sourceCommit,
    repository: request.policy.repository,
    registry: request.policy.registry,
    tag: request.tag,
    ...(request.policy.topology === "paired"
      ? { sources: request.raw.sources }
      : {}),
    packages,
  };
  await writeFile(
    path.join(output, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx" }
  );
  return { status: "candidate-built", output, manifest, published: false };
}

/** Only stage archives from a reviewed commit; final approval belongs to npm 2FA.
 * @param {string} root @param {string} manifestFile @param {boolean} dryRun @param {import('./types.d.mts').Runner} [run]
 * @param {NodeJS.ProcessEnv} [env]
 */
export async function ciStageCandidate(
  root,
  manifestFile,
  dryRun,
  run = ciRun,
  env = process.env
) {
  const manifest = await ciReadJson(manifestFile);
  if (
    !ciIsRecord(manifest) ||
    manifest.schemaVersion !== 1 ||
    typeof manifest.request !== "string" ||
    !Array.isArray(manifest.packages)
  )
    throw new CiDevUsageError("Invalid candidate manifest.");
  const request = await releaseRequest(root, manifest.request, run);
  if (request.policy.topology === "paired")
    throw new CiDevUsageError(
      "Paired releases stage from each build repository. Use dev npm deliver and the generated build-repository workflow."
    );
  const head = (await run("git", ["rev-parse", "HEAD"], root)).trim();
  if (
    manifest.sourceCommit !== head ||
    manifest.repository !== request.policy.repository ||
    manifest.registry !== request.policy.registry ||
    manifest.tag !== request.tag ||
    manifest.packages.length !== request.releases.length
  )
    throw new CiDevUsageError(
      "Candidate does not match the checked-out release commit and policy."
    );
  const directory = await realpath(path.dirname(manifestFile));
  const archives = [];
  const seen = new Set();
  for (const item of manifest.packages) {
    if (
      !ciIsRecord(item) ||
      typeof item.name !== "string" ||
      seen.has(item.name) ||
      typeof item.file !== "string" ||
      path.basename(item.file) !== item.file ||
      !item.file.endsWith(".tgz")
    )
      throw new CiDevUsageError("Invalid candidate archive entry.");
    const approved = request.releases.find((entry) => entry.name === item.name);
    if (
      !approved ||
      item.version !== approved.newVersion ||
      item.access !== approved.access
    )
      throw new CiDevUsageError(
        "Candidate package differs from release policy."
      );
    const file = path.join(directory, item.file);
    const stat = await lstat(file);
    if (
      !stat.isFile() ||
      stat.isSymbolicLink() ||
      hash(await readFile(file)) !== item.sha256
    )
      throw new CiDevUsageError(
        "Candidate archive hash changed or is not a regular file."
      );
    const packed = JSON.parse(
      await run("tar", ["-xOf", file, "package/package.json"], root)
    );
    if (
      !ciIsRecord(packed) ||
      packed.name !== item.name ||
      packed.version !== item.version ||
      packed.private === true
    )
      throw new CiDevUsageError(
        "Archive manifest does not match the candidate."
      );
    assertPublishMetadata(packed, request.policy, approved.access, request.tag);
    seen.add(item.name);
    archives.push({
      file,
      name: item.name,
      access: approved.access,
      sha256: item.sha256,
    });
  }
  if (dryRun)
    return {
      status: "stage-preview",
      packages: archives.map((item) => item.name),
      published: false,
    };
  if (
    env.GITHUB_ACTIONS !== "true" ||
    env.GITHUB_REPOSITORY !== request.policy.repository ||
    env.GITHUB_REF !== `refs/heads/${request.policy.baseBranch}` ||
    !request.policy.reviewers.some(
      (name) => name.toLowerCase() === env.GITHUB_ACTOR?.toLowerCase()
    )
  )
    throw new CiDevUsageError(
      "Staging is restricted to the configured GitHub base branch, repository and reviewer-triggered workflow."
    );
  const npmVersion = (await run("npm", ["--version"], root)).trim();
  if (!semver.valid(npmVersion) || semver.lt(npmVersion, "11.15.0"))
    throw new CiDevUsageError("Native npm staging requires npm >=11.15.0.");
  // Check every package exists before staging any; bootstrap is explicitly separate.
  for (const archive of archives)
    await run(
      "npm",
      [
        "view",
        archive.name,
        "version",
        "--json",
        "--registry",
        request.policy.registry,
      ],
      root
    );
  const staged = [];
  for (const archive of archives) {
    try {
      if (hash(await readFile(archive.file)) !== archive.sha256)
        throw new CiDevUsageError("Archive changed after staging preflight.");
      const response = await run(
        "npm",
        [
          "stage",
          "publish",
          archive.file,
          "--access",
          archive.access,
          "--tag",
          request.tag,
          "--registry",
          request.policy.registry,
          "--ignore-scripts",
        ],
        root
      );
      staged.push({ name: archive.name, response });
      await writeFile(
        path.join(directory, "staging-results.json"),
        `${JSON.stringify(
          { status: "awaiting-npm-approval", staged, published: false },
          null,
          2
        )}\n`
      );
    } catch (error) {
      throw new Error(
        `Staging stopped at ${archive.name}; ${staged.length} earlier package(s) may already be staged. Inspect npm Staged Packages before retrying; never fall back to npm publish.`,
        { cause: error }
      );
    }
  }
  return { status: "awaiting-npm-approval", staged, published: false };
}
