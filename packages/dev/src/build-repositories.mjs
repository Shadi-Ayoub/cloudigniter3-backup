import path from "node:path";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, lstat, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ciReadPolicy, ciReadJson, ciIsRecord } from "./policy.mjs";
import { ciReadPairedRequest } from "./paired-releases.mjs";
import { ciRepositoryProject, ciCheckRepository } from "./repositories.mjs";
import { ciAuthorizeRequester } from "./github-policy.mjs";
import { ciGithub, ciSha, ciStringField } from "./github-api.mjs";
import { ciCreateReviewRequest } from "./github-request.mjs";
import { ciDigest } from "./release-plan.mjs";
import { assertPublishMetadata } from "./npm-staging.mjs";
import { ciRun, CiDevUsageError } from "./runtime.mjs";

/** @param {Buffer} bytes */
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** @param {string} root @param {string} manifestFile @param {boolean} dryRun @param {import('./types.d.mts').Runner} [run] */
export async function ciDeliverBuilds(root, manifestFile, dryRun, run = ciRun) {
  const policy = await ciReadPolicy(root);
  if (policy.topology !== "paired")
    throw new CiDevUsageError(
      "npm deliver requires paired source/build repositories."
    );
  const manifest = await ciReadJson(manifestFile);
  if (
    !ciIsRecord(manifest) ||
    manifest.schemaVersion !== 1 ||
    typeof manifest.request !== "string" ||
    !/^[a-f0-9]{24}$/.test(manifest.request) ||
    !Array.isArray(manifest.packages) ||
    manifest.registry !== policy.registry ||
    typeof manifest.tag !== "string" ||
    !policy.tags.includes(manifest.tag)
  )
    throw new CiDevUsageError("Invalid paired candidate manifest.");
  const request = await ciReadPairedRequest(
    root,
    manifest.request,
    policy,
    run
  );
  if (
    !ciIsRecord(request.plan) ||
    !Array.isArray(request.plan.releases) ||
    manifest.packages.length !== request.plan.releases.length ||
    manifest.tag !== request.plan.tag ||
    ciDigest(manifest.sources) !== ciDigest(request.sources)
  )
    throw new CiDevUsageError(
      "Candidate differs from the approved source request."
    );
  if (
    manifest.sourceCommit !==
    (await run("git", ["rev-parse", "HEAD"], root)).trim()
  )
    throw new CiDevUsageError(
      "Candidate belongs to another integration commit."
    );
  const directory = await realpath(path.dirname(manifestFile));
  const seen = new Set();
  const candidates = [];
  for (const entry of manifest.packages) {
    if (
      !ciIsRecord(entry) ||
      typeof entry.name !== "string" ||
      seen.has(entry.name) ||
      typeof entry.version !== "string" ||
      typeof entry.file !== "string" ||
      path.basename(entry.file) !== entry.file ||
      !entry.file.endsWith(".tgz")
    )
      throw new CiDevUsageError("Invalid paired candidate entry.");
    const approved = request.plan.releases.find(
      (item) => ciIsRecord(item) && item.name === entry.name
    );
    const configured = policy.packages[entry.name];
    if (
      !ciIsRecord(approved) ||
      approved.newVersion !== entry.version ||
      !configured?.buildRepository ||
      entry.access !== configured.access
    )
      throw new CiDevUsageError(
        "Candidate package differs from approved versions or access."
      );
    const file = path.join(directory, entry.file);
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 50 * 1024 * 1024)
      throw new CiDevUsageError(
        "Archive must be a regular file of at most 50 MiB."
      );
    const bytes = await readFile(file);
    if (hash(bytes) !== entry.sha256)
      throw new CiDevUsageError("Candidate archive hash changed.");
    const packed = JSON.parse(
      await run("tar", ["-xOf", file, "package/package.json"], root)
    );
    if (
      !ciIsRecord(packed) ||
      packed.name !== entry.name ||
      packed.version !== entry.version ||
      packed.private === true
    )
      throw new CiDevUsageError("Packed manifest differs from the candidate.");
    assertPublishMetadata(packed, policy, configured.access, manifest.tag);
    const record = {
      schemaVersion: 1,
      name: entry.name,
      version: entry.version,
      access: entry.access,
      registry: policy.registry,
      tag: manifest.tag,
      repository: configured.buildRepository,
      sourceRepository: configured.sourceRepository,
      request: manifest.request,
      integrationCommit: manifest.sourceCommit,
      sha256: entry.sha256,
      archive: "package.tgz",
    };
    candidates.push({
      name: entry.name,
      version: entry.version,
      repository: configured.buildRepository,
      bytes,
      record,
    });
    seen.add(entry.name);
  }
  if (dryRun)
    return {
      status: "build-delivery-preview",
      packages: candidates.map(({ name, version, repository }) => ({
        name,
        version,
        repository,
      })),
      published: false,
    };
  const api = ciGithub(root, run);
  const login = ciStringField(await api("user"), "login");
  await ciAuthorizeRequester(root, login);
  const reviewers = policy.reviewers.filter(
    (name) => name.toLowerCase() !== login.toLowerCase()
  );
  if (!reviewers.length || reviewers.some((name) => name.includes("/")))
    throw new CiDevUsageError(
      "Another individual must approve build delivery."
    );
  const targets = [];
  // Complete preflight for the whole batch before uploading any archive.
  for (const candidate of candidates) {
    await ciCheckRepository(root, candidate.repository, true, run);
    const base = await api(
      `repos/${candidate.repository}/git/ref/heads/${encodeURIComponent(
        policy.baseBranch
      )}`
    );
    if (!ciIsRecord(base)) throw new Error("Invalid build base branch.");
    const baseSha = ciSha(base.object);
    const listing = await api(
      `repos/${candidate.repository}/git/trees/${baseSha}?recursive=1`
    );
    if (
      !ciIsRecord(listing) ||
      listing.truncated !== false ||
      !Array.isArray(listing.tree)
    )
      throw new CiDevUsageError("Cannot inspect build repository.");
    if (
      listing.tree.some(
        (item) =>
          ciIsRecord(item) &&
          typeof item.path === "string" &&
          item.path.startsWith(`releases/${candidate.version}/`)
      )
    )
      throw new CiDevUsageError(
        "This build version already exists; inspect it instead of replacing immutable release files."
      );
    if (
      !listing.tree.some(
        (item) =>
          ciIsRecord(item) && item.path === ".github/workflows/npm-stage.yml"
      )
    )
      throw new CiDevUsageError(
        "Initialize the build repository using dev github scaffold before delivering artifacts."
      );
    targets.push({ ...candidate, baseSha });
  }
  const delivered = [];
  for (const target of targets) {
    try {
      const blob = await api(`repos/${target.repository}/git/blobs`, {
        content: target.bytes.toString("base64"),
        encoding: "base64",
      });
      const result = await ciCreateReviewRequest(
        root,
        {
          repository: target.repository,
          baseBranch: policy.baseBranch,
          baseSha: target.baseSha,
          branch: `build/cloudigniter/${manifest.request}`,
          prefix: "build/cloudigniter/",
          reviewers,
          title: `chore(build): ${target.name}@${target.version}`,
          body: `Source request: \`${manifest.request}\`\nArchive SHA-256: \`${target.record.sha256}\`\n\nReview the exact archive and manifest. After merge, an approver runs npm-stage.yml with version ${target.version}. No npm upload has occurred.`,
          files: [
            {
              path: `releases/${target.version}/package.tgz`,
              sha: ciSha(blob),
            },
            {
              path: `releases/${target.version}/manifest.json`,
              content: JSON.stringify(target.record, null, 2) + "\n",
            },
          ],
        },
        run
      );
      delivered.push({
        package: target.name,
        repository: target.repository,
        ...result,
      });
    } catch (error) {
      throw new Error(
        `Build delivery stopped after ${delivered.length} PR(s). Inspect existing build requests before retrying.`,
        { cause: error }
      );
    }
  }
  return {
    status: "awaiting-build-review",
    requests: delivered,
    published: false,
  };
}

/** Generate reviewable repository files locally; do not create repositories or push.
 * @param {string} root @param {string} id @param {string} destination @param {string} [hosting]
 */
export async function ciScaffoldBuildRepository(
  root,
  id,
  destination,
  hosting
) {
  const { project, baseBranch } = await ciRepositoryProject(root, id);
  const policy = await ciReadPolicy(root);
  if (
    project.type === "template" ||
    (project.type === "website" && hosting !== "static") ||
    (project.type === "package" && hosting !== undefined)
  )
    throw new CiDevUsageError(
      "Scaffold npm packages without --hosting; static websites require explicit --hosting=static. Server-rendered websites need a runtime deployment design."
    );
  if (!destination.trim())
    throw new CiDevUsageError("scaffold requires --output=<new-directory>.");
  const output = path.join(
    await realpath(path.dirname(path.resolve(destination))),
    path.basename(path.resolve(destination))
  );
  const workspace = await realpath(root);
  if (
    output === workspace ||
    output.startsWith(workspace + path.sep) ||
    workspace.startsWith(output + path.sep)
  )
    throw new CiDevUsageError("Scaffold outside the integration workspace.");
  if (project.type === "website") {
    const template = await readFile(
      fileURLToPath(new URL("./ci/deploy-static-site.yml", import.meta.url)),
      "utf8"
    );
    const approvers = policy.reviewers.filter((name) => !name.includes("/"));
    if (!approvers.length)
      throw new CiDevUsageError("Configure individual website approvers.");
    const workflow = template
      .replaceAll("__REPOSITORY__", project.buildRepository)
      .replaceAll("__BASE__", baseBranch)
      .replaceAll(
        "__APPROVERS__",
        approvers
          .map(
            (name) =>
              `github.actor == '${name}' && github.triggering_actor == '${name}'`
          )
          .join(" || ")
      );
    await mkdir(output);
    await mkdir(path.join(output, ".github/workflows"), { recursive: true });
    await writeFile(
      path.join(output, ".github/workflows/deploy-aws.yml"),
      workflow
    );
    await writeFile(
      path.join(output, ".github/CODEOWNERS"),
      `* ${approvers.map((name) => `@${name}`).join(" ")}\n`
    );
    await writeFile(
      path.join(output, "README.md"),
      `# ${id} static build repository\n\nSource: https://github.com/${project.sourceRepository}.\n\nCommit the reviewed static build under site/ through a PR. It must contain index.html. Do not commit source credentials, node_modules or server-rendered Next.js .next output. Configure production environment variables AWS_ROLE_ARN, AWS_REGION, SITE_BUCKET and CLOUDFRONT_DISTRIBUTION_ID, plus GitHub OIDC trust in AWS. Protect main and require the configured approver's review. Run deploy-aws.yml after merge; it uploads the exact committed site without rebuilding. No AWS resources are created by this scaffold.\n`
    );
    return {
      status: "scaffolded",
      repository: project.buildRepository,
      hosting: "static",
      output,
      pushed: false,
    };
  }
  const entry = project.package ? policy.packages[project.package] : undefined;
  if (!entry)
    throw new CiDevUsageError("Package is absent from release policy.");
  const stage = await readFile(
    fileURLToPath(new URL("./ci/npm-stage.mjs", import.meta.url)),
    "utf8"
  );
  const workflow = `name: Stage approved package\non:\n  workflow_dispatch:\n    inputs:\n      version:\n        description: Reviewed version directory under releases/\n        required: true\n        type: string\npermissions:\n  contents: read\nconcurrency:\n  group: npm-stage\n  cancel-in-progress: false\njobs:\n  stage:\n    if: github.ref == 'refs/heads/${baseBranch}'\n    runs-on: ubuntu-latest\n    environment: npm-staging\n    permissions:\n      contents: read\n      id-token: write\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          persist-credentials: false\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '24'\n          registry-url: https://registry.npmjs.org\n      - run: npm install --global npm@11.19.1\n      - name: Stage the approved archive\n        env:\n          RELEASE_VERSION: \${{ inputs.version }}\n          NODE_AUTH_TOKEN: \${{ secrets.NPM_READ_TOKEN }}\n          NPM_CONFIG_PROVENANCE: 'false'\n        run: node .github/scripts/npm-stage.mjs\n      - uses: actions/upload-artifact@v4\n        if: always()\n        with:\n          name: npm-staging-result\n          path: staging-result.json\n          if-no-files-found: warn\n`;
  await mkdir(output);
  await mkdir(path.join(output, ".github/scripts"), { recursive: true });
  await mkdir(path.join(output, ".github/workflows"));
  await writeFile(path.join(output, ".github/scripts/npm-stage.mjs"), stage);
  await writeFile(
    path.join(output, ".github/workflows/npm-stage.yml"),
    workflow
  );
  await writeFile(
    path.join(output, "release-policy.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        name: project.package,
        repository: project.buildRepository,
        sourceRepository: project.sourceRepository,
        baseBranch,
        registry: policy.registry,
        access: entry.access,
        tags: policy.tags,
        reviewers: policy.reviewers,
      },
      null,
      2
    ) + "\n"
  );
  await writeFile(
    path.join(output, ".github/CODEOWNERS"),
    `* ${policy.reviewers
      .filter((name) => !name.includes("/"))
      .map((name) => `@${name}`)
      .join(" ")}\n`
  );
  await writeFile(
    path.join(output, "README.md"),
    `# ${project.package} build repository\n\nPrivate reviewed release archives. Source: https://github.com/${project.sourceRepository}.\n\nProtect main with independent Code Owner review. Configure the npm stage-only trusted publisher for this repository, workflow npm-stage.yml, environment npm-staging. After reviewing and merging a build PR, a configured approver runs the workflow with its version. Final npm approval requires interactive 2FA.\n\nDo not install this repository or rebuild its tarball. Immutable releases/<version>/package.tgz is the exact candidate verified in the development workspace.\n`
  );
  return {
    status: "scaffolded",
    repository: project.buildRepository,
    output,
    pushed: false,
  };
}
