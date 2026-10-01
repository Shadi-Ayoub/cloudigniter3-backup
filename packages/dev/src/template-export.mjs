import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";
import semver from "semver";
import { CiDevUsageError } from "./runtime.mjs";
import { ciAssertDeveloperWorkspace } from "./maintainer-runtime.mjs";
import { ciAssertCommandFlags } from "./maintainer-cli.mjs";

export const ciTemplateHelp = `
  Public template commands (run in the private company workspace)
    template export --output=<directory> [--source=apps/<path>] [options]
      Export the policy-approved application files into an external directory.
      Existing directories require --overwrite; otherwise they are refused.
      Resolve public package versions, apply standalone configuration, and validate.
      --dry-run reads and validates all inputs without creating the directory.
    template check --output=<directory> [--source=apps/<path>] [options]
      Compare an export byte-for-byte with current policy and source inputs.
      Fail for missing, changed, extra, or symlinked files; no files are modified.
    template publish --output=<directory> --summary=<text> [options]
      Verify the export and request review in the PRIVATE company GitHub repo.
      Requires an allowed gh requester, clean company base branch and another
      reviewer. Sends metadata only; no public upload before approval.
      --dry-run validates the candidate offline without contacting GitHub.
    template status <pull-request-number>
      Read open/closed/merged template request state; npm status is unverified.
    template deliver <private-pull-request-number> [--dry-run]
      Reviewer only: verify a merged request, independent approval and exact
      export digest, then update the public branch without company Git history.
      --dry-run checks approval remotely but never publishes or writes files.
    --source           Application directory below apps, relative to the workspace.
                       Any folder name/nesting; default: selected policy's source.
    --policy           Workspace-relative export policy (default:
                       .cloudigniter/template-policy.json). Use one per layout.
    --name             Exported package.json name; default: selected policy's name.
                       Lowercase letters/digits, dots, underscores and hyphens;
                       an optional @scope/ is supported. Independent of folder names.
    --package-version  Optional exact version for all policy-listed public packages.
                       Default: individual versions in the selected export policy.
    --output           Required; relative to the invoking directory. Parent must exist.
    --overwrite        Export only: delete ALL contents of an existing output directory
                       after validating and staging the new export. Refuse symlink
                       destinations, protected paths and Git checkouts.
                       With --dry-run, preview replacement without deleting or writing.
    --json             Print file hashes, versions, content digest and validation status.
  Export/check never push to GitHub. Publish creates a private review branch/PR.
  Deliver publishes approved files to the configured public branch. No command
  installs, builds, deploys AWS, contacts npm, creates repos or grants approval.
  Use identical source, policy, name and version options for export and check.
  Example: dev template export --source=apps/starters/next-aws --output=../public-app
`;

/** @param {unknown} value @param {string} label @returns {Record<string, unknown>} */
function object(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new CiDevUsageError(`${label} must be an object.`);
  return /** @type {Record<string, unknown>} */ (value);
}

/** @param {unknown} value @param {string} label */
function strings(value, label) {
  const result = object(value, label);
  /** @type {Record<string, string>} */
  const entries = {};
  for (const [key, text] of Object.entries(result)) {
    if (typeof text !== "string" || !text.trim())
      throw new CiDevUsageError(`${label}.${key} must be a nonempty string.`);
    entries[key] = text;
  }
  return entries;
}

/** @param {unknown} value @param {string} label @returns {string[]} */
function list(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string"))
    throw new CiDevUsageError(`${label} must be an array of strings.`);
  if (new Set(value).size !== value.length)
    throw new CiDevUsageError(`${label} contains duplicates.`);
  return value;
}

/** @param {unknown} value @returns {string} */
function relativeFile(value) {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    value
      .split("/")
      .some(
        (part) =>
          !part ||
          part === "." ||
          part === ".." ||
          /[\x00-\x1f:*?<>|]/.test(part),
      )
  )
    throw new CiDevUsageError(
      `Expected a confined relative file path: ${String(value)}`,
    );
  return value;
}

/** @param {string} file */
function publicPath(file) {
  relativeFile(file);
  for (const part of file.split("/")) {
    if (
      /^(?:\.git|\.agents|\.codex|\.cloudigniter|\.aws|\.amplify|\.next|node_modules|coverage|dist|\.DS_Store|\.npmrc|\.pnpmfile\.cjs|amplify_outputs(?:\..*)?\.json|root-user\.json)$/i.test(
        part,
      ) ||
      part.startsWith("._") ||
      /^\.env(?:$|\.)/i.test(part) ||
      /\.(?:pem|key|p12|pfx|log|tsbuildinfo)$/i.test(part)
    )
      throw new CiDevUsageError(
        `Private or generated path cannot be exported: ${file}`,
      );
  }
}

/** Read only regular files, rejecting symlinks in every path component.
 * @param {string} root @param {string} relative
 */
async function readConfined(root, relative) {
  const parts = relativeFile(relative).split("/");
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = await lstat(current);
    if (
      stat.isSymbolicLink() ||
      (index === parts.length - 1 ? !stat.isFile() : !stat.isDirectory())
    )
      throw new CiDevUsageError(
        `Expected a regular file without symlinks: ${relative}`,
      );
    if (index === parts.length - 1 && stat.size > 10 * 1024 * 1024)
      throw new CiDevUsageError(`Template file exceeds 10 MiB: ${relative}`);
  }
  return readFile(current);
}

/** @param {string} version */
function exactVersion(version) {
  if (semver.valid(version) !== version)
    throw new CiDevUsageError(
      `Use an exact package version (for example 0.1.0): ${version}`,
    );
  return version;
}

/** @param {string} file @param {Buffer} bytes */
function validateContent(file, bytes) {
  if (
    !/\.(?:[cm]?[jt]sx?|json|css|mdx?|ya?ml|txt)$/.test(file) &&
    !path.basename(file).startsWith(".")
  )
    return;
  const text = bytes.toString("utf8");
  const forbidden = [
    /@cloudigniter\/(?:dev|config-ts)(?:[\s/"'`]|$)/,
    /@ci-(?:core|aws|next|ui)\//,
    /(?:\.\.\/)+packages\//,
    /(?:\/Users\/|\/Volumes\/|[A-Z]:\\Users\\)/,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
    /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|npm_[A-Za-z0-9]{30,})\b/,
  ];
  if (forbidden.some((pattern) => pattern.test(text)))
    throw new CiDevUsageError(
      `Private dependency, workspace reference, or credential-like content in ${file}. Review the source; values are not printed.`,
    );
}

/** @typedef {{source?: string, policy?: string, name?: string, packageVersion?: string}} CiTemplateOptions */

/** @param {string} root @param {CiTemplateOptions} [options] */
export async function ciPlanTemplateExport(root, options = {}) {
  const policyFile = relativeFile(
    options.policy ?? ".cloudigniter/template-policy.json",
  );
  const policy = object(
    JSON.parse((await readConfined(root, policyFile)).toString()),
    "Template policy",
  );
  const keys = [
    "schemaVersion",
    "source",
    "name",
    "files",
    "overlays",
    "versions",
    "dependencyVersions",
    "removeDependencies",
    "scripts",
    "replacements",
  ];
  if (
    policy.schemaVersion !== 1 ||
    Object.keys(policy).some((key) => !keys.includes(key))
  )
    throw new CiDevUsageError(
      "Unknown template policy fields or unsupported schemaVersion; expected 1.",
    );
  const source = relativeFile(options.source ?? policy.source);
  if (!source.startsWith("apps/"))
    throw new CiDevUsageError(
      "Template source must be an application directory under apps (for example apps/starters/next-aws).",
    );
  // Validate the application itself even when policy overlays replace every file.
  object(
    JSON.parse((await readConfined(root, `${source}/package.json`)).toString()),
    "Source application package.json",
  );
  const name = options.name ?? policy.name;
  if (
    typeof name !== "string" ||
    name.length > 214 ||
    !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name)
  )
    throw new CiDevUsageError(
      "Exported package name must use lowercase letters/digits, dots, underscores or hyphens, optionally @scope/name (maximum 214 characters). Source folder names are independent.",
    );
  const selected = list(policy.files, "files");
  const overlays = strings(policy.overlays, "overlays");
  const versions = strings(policy.versions, "versions");
  const dependencyVersions = strings(
    policy.dependencyVersions ?? {},
    "dependencyVersions",
  );
  if (options.packageVersion !== undefined)
    exactVersion(options.packageVersion);
  for (const [name, version] of Object.entries(versions)) {
    if (
      !/^@cloudigniter\/[a-z][a-z0-9-]*$/.test(name) ||
      ["@cloudigniter/dev", "@cloudigniter/config-ts"].includes(name)
    )
      throw new CiDevUsageError(
        `Invalid public package in template policy: ${name}`,
      );
    exactVersion(version);
    versions[name] = options.packageVersion ?? version;
  }
  const remove = list(policy.removeDependencies, "removeDependencies");
  if (remove.some((name) => name !== "@cloudigniter/config-ts"))
    throw new CiDevUsageError(
      "Only the internal TypeScript configuration dependency may be removed.",
    );
  /** @type {Map<string, Buffer>} */
  const files = new Map();
  const folded = new Set();
  for (const file of [...selected, ...Object.keys(overlays)]) {
    publicPath(file);
    if (folded.has(file.toLowerCase()))
      throw new CiDevUsageError(
        `Duplicate or case-colliding export path: ${file}`,
      );
    folded.add(file.toLowerCase());
    files.set(
      file,
      await readConfined(root, overlays[file] ?? `${source}/${file}`),
    );
  }
  for (const file of folded) {
    const parts = file.split("/");
    while (parts.pop() && parts.length)
      if (folded.has(parts.join("/")))
        throw new CiDevUsageError(`Export file/directory collision: ${file}`);
  }
  if (!files.has("package.json") || !files.has("tsconfig.json"))
    throw new CiDevUsageError(
      "Template policy must provide package.json and standalone tsconfig.json.",
    );
  const sourcePackage = object(
    JSON.parse(files.get("package.json")?.toString() ?? "{}"),
    "Template package.json",
  );
  const dependencies = strings(
    sourcePackage.dependencies ?? {},
    "dependencies",
  );
  const devDependencies = strings(
    sourcePackage.devDependencies ?? {},
    "devDependencies",
  );
  if (
    sourcePackage.optionalDependencies ||
    sourcePackage.peerDependencies ||
    sourcePackage.bundledDependencies ||
    sourcePackage.bundleDependencies
  )
    throw new CiDevUsageError(
      "Template dependency sections other than dependencies/devDependencies require an explicit exporter migration.",
    );
  const used = new Set();
  for (const section of [dependencies, devDependencies]) {
    for (const [name, specifier] of Object.entries(section)) {
      if (remove.includes(name)) {
        delete section[name];
        continue;
      }
      if (name.startsWith("@cloudigniter/")) {
        if (!versions[name])
          throw new CiDevUsageError(
            `No public template version approved for ${name}.`,
          );
        section[name] = versions[name];
        used.add(name);
      } else if (!semver.validRange(specifier)) {
        throw new CiDevUsageError(
          `Template requires registry semver dependencies; unsupported specifier for ${name}.`,
        );
      }
    }
  }
  for (const name of Object.keys(versions)) {
    if (!used.has(name))
      throw new CiDevUsageError(
        `Unused public template package version: ${name}`,
      );
    if (name !== "@cloudigniter/cli" && devDependencies[name]) {
      dependencies[name] = devDependencies[name];
      delete devDependencies[name];
    }
  }
  for (const [name, version] of Object.entries(dependencyVersions)) {
    const current = dependencies[name] ?? devDependencies[name];
    exactVersion(version);
    if (
      name.startsWith("@cloudigniter/") ||
      (current && !semver.satisfies(version, current))
    )
      throw new CiDevUsageError(
        `Third-party template pin must satisfy its source dependency range: ${name}`,
      );
    if (dependencies[name] || !current) dependencies[name] = version;
    if (devDependencies[name]) devDependencies[name] = version;
  }
  const workspace = object(
    JSON.parse((await readConfined(root, "package.json")).toString()),
    "Workspace manifest",
  );
  if (
    typeof workspace.packageManager !== "string" ||
    !/^pnpm@\d+\.\d+\.\d+(?:\+.*)?$/.test(workspace.packageManager)
  )
    throw new CiDevUsageError(
      "Workspace must pin its pnpm packageManager for a standalone export.",
    );
  files.set(
    "package.json",
    Buffer.from(
      JSON.stringify(
        {
          name,
          version: "0.1.0",
          private: true,
          packageManager: workspace.packageManager,
          engines: { node: ">=22.14.0" },
          scripts: strings(policy.scripts, "scripts"),
          dependencies,
          devDependencies,
        },
        null,
        2,
      ) + "\n",
    ),
  );
  const replacements = object(policy.replacements, "replacements");
  for (const [file, rules] of Object.entries(replacements)) {
    if (!files.has(file) || file === "package.json" || !Array.isArray(rules))
      throw new CiDevUsageError(`Invalid replacement target: ${file}`);
    let text = files.get(file)?.toString("utf8") ?? "";
    for (const value of rules) {
      const rule = strings(value, `replacement in ${file}`);
      if (
        Object.keys(rule).sort().join(",") !== "from,to" ||
        text.split(rule.from).length !== 2
      )
        throw new CiDevUsageError(
          `Replacement in ${file} must match exactly once; update policy after source drift.`,
        );
      text = text.replace(rule.from, () => rule.to);
    }
    files.set(file, Buffer.from(text));
  }
  let size = 0;
  for (const [file, bytes] of files) {
    validateContent(file, bytes);
    size += bytes.length;
  }
  if (size > 100 * 1024 * 1024)
    throw new CiDevUsageError("Template export exceeds 100 MiB.");
  const hashes = [...files.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([file, bytes]) => ({
      path: file,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
    }));
  return {
    source,
    policy: policyFile,
    name,
    files,
    versions,
    hashes,
    digest: createHash("sha256").update(JSON.stringify(hashes)).digest("hex"),
  };
}

/** @param {string} directory @returns {Promise<string[]>} */
async function inventory(directory) {
  /** @type {string[]} */
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile()))
      throw new Error(
        `Export contains a symlink or non-regular entry: ${entry.name}`,
      );
    if (entry.isDirectory()) {
      const nested = await inventory(path.join(directory, entry.name));
      if (!nested.length)
        throw new Error(`Unexpected empty export directory: ${entry.name}`);
      files.push(...nested.map((file) => `${entry.name}/${file}`));
    } else files.push(entry.name);
  }
  return files;
}

/** @param {string} parent @param {string} child */
function contains(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

/** @param {string} target */
async function statIfExists(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT"))
      throw error;
    return undefined;
  }
}

/** Do not follow links while checking for nested Git checkouts.
 * @param {string} directory
 */
async function assertNoGitDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.toLowerCase() === ".git")
      throw new CiDevUsageError(
        "Cannot overwrite an output containing a Git checkout.",
      );
    if (entry.isDirectory())
      await assertNoGitDirectory(path.join(directory, entry.name));
  }
}

/** @param {string} output @param {import('node:fs').Stats} existing */
async function assertReplaceable(output, existing) {
  if (!existing.isDirectory() || existing.isSymbolicLink())
    throw new CiDevUsageError(
      "--overwrite requires a regular output directory without a symlink.",
    );
  for (const protectedPath of [
    await realpath(homedir()),
    await realpath(process.cwd()),
  ]) {
    if (contains(output, protectedPath))
      throw new CiDevUsageError(
        "Cannot overwrite a protected home or working directory, or its ancestors.",
      );
  }
  for (let directory = output; ; directory = path.dirname(directory)) {
    if (await statIfExists(path.join(directory, ".git")))
      throw new CiDevUsageError(
        "Cannot overwrite an output inside a Git checkout.",
      );
    if (directory === path.dirname(directory)) break;
  }
  await assertNoGitDirectory(output);
}

/** @param {string} output @param {Map<string, Buffer>} files */
async function writeExport(output, files) {
  for (const [file, bytes] of files) {
    const target = path.join(output, file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: "wx", mode: 0o644 });
  }
}

/** @param {string} output @param {Awaited<ReturnType<typeof ciPlanTemplateExport>>} plan */
export async function ciAssertTemplateMatches(output, plan) {
  const stat = await lstat(output);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new CiDevUsageError("Expected an existing regular export directory.");
  const actual = await inventory(output);
  const unexpected = actual.filter((file) => !plan.files.has(file));
  if (unexpected.length)
    throw new Error(`Unexpected export files: ${unexpected.join(", ")}`);
  for (const [file, bytes] of plan.files) {
    let actualBytes;
    try {
      actualBytes = await readConfined(output, file);
    } catch {
      throw new Error(`Missing or invalid export file: ${file}`);
    }
    if (!bytes.equals(actualBytes))
      throw new Error(`Export differs from current source/policy: ${file}`);
  }
}

/** @param {string[]} input
 * @param {CiTemplateOptions & {workspaceRoot?: string, output?: string, dryRun?: boolean, overwrite?: boolean, json?: boolean}} flags
 * @param {string[]} argv
 */
export async function ciRunTemplateCommand(input, flags, argv) {
  const [, command, ...extra] = input;
  if (!["export", "check"].includes(command ?? "") || extra.length)
    throw new CiDevUsageError(
      "Use dev template export or dev template check. Run dev --help.",
    );
  ciAssertCommandFlags(argv, [
    "output",
    "source",
    "policy",
    "name",
    "package-version",
    "json",
    ...(command === "export" ? ["dry-run", "overwrite"] : []),
  ]);
  if (!flags.output?.trim())
    throw new CiDevUsageError(
      "Template commands require --output=<directory>.",
    );
  const root = await realpath(
    await ciAssertDeveloperWorkspace(flags.workspaceRoot ?? process.cwd()),
  );
  const requested = path.resolve(flags.output);
  const output = path.join(
    await realpath(path.dirname(requested)),
    path.basename(requested),
  );
  if (contains(root, output) || contains(output, root))
    throw new CiDevUsageError(
      "Template output must be outside the private workspace and cannot contain it.",
    );
  const existing = await statIfExists(output);
  if (command === "export" && existing) {
    if (!flags.overwrite)
      throw new CiDevUsageError(
        `Output already exists: ${output}. Choose a new directory or use --overwrite to replace all its contents.`,
      );
    await assertReplaceable(output, existing);
  }
  if (
    command === "check" &&
    (!existing?.isDirectory() || existing.isSymbolicLink())
  )
    throw new CiDevUsageError(
      "template check requires an existing regular export directory.",
    );
  const plan = await ciPlanTemplateExport(root, flags);
  if (command === "check") {
    await ciAssertTemplateMatches(output, plan);
  } else if (!flags.dryRun) {
    if (existing) {
      const staged = await mkdtemp(
        path.join(path.dirname(output), ".cloudigniter-export-"),
      );
      try {
        await writeExport(staged, plan.files);
        const current = await lstat(output);
        if (current.dev !== existing.dev || current.ino !== existing.ino)
          throw new CiDevUsageError(
            "Output changed during export; retry after reviewing the destination.",
          );
        await assertReplaceable(output, current);
        await rm(output, { recursive: true });
        await rename(staged, output);
      } finally {
        await rm(staged, { recursive: true, force: true });
      }
    } else {
      await mkdir(output); // Exclusive reservation: do not adopt a newly appearing destination.
      await writeExport(output, plan.files);
    }
  }
  const report = {
    schemaVersion: 1,
    command,
    source: plan.source,
    policy: plan.policy,
    name: plan.name,
    output,
    written: command === "export" && !flags.dryRun,
    wouldReplace: command === "export" && Boolean(existing),
    replaced: command === "export" && Boolean(existing) && !flags.dryRun,
    validated: true,
    registryVerified: false,
    buildVerified: false,
    published: false,
    digest: plan.digest,
    versions: plan.versions,
    files: plan.hashes,
  };
  console.log(
    flags.json
      ? JSON.stringify(report, null, 2)
      : `${command === "check" ? "Template matches current source and policy" : flags.dryRun ? "Template export preview" : "Template exported"}: ${output}\n${report.wouldReplace ? (flags.dryRun ? "Would replace the existing directory and all its contents.\n" : "Replaced the existing directory and all its contents.\n") : ""}Source: ${plan.source}\nPolicy: ${plan.policy}\nApplication name: ${plan.name}\n${plan.files.size} files; SHA-256 ${plan.digest}\nPublic package availability and application build remain unverified. Review the export before GitHub publication.`,
  );
}
