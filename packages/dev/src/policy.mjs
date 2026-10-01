import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import { CiDevUsageError } from "./runtime.mjs";
import { ciReadRepositories } from "./repositories.mjs";

export const ciPolicyPath = ".cloudigniter/release-policy.json";

/** @param {unknown} value @returns {value is Record<string, unknown>} */
export function ciIsRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @param {string} file @returns {Promise<unknown>} */
export async function ciReadJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

/** @param {string} start */
export async function ciFindWorkspace(start) {
  let directory = await realpath(path.resolve(start));
  while (true) {
    try {
      await readFile(path.join(directory, "pnpm-workspace.yaml"));
      const manifest = await ciReadJson(path.join(directory, "package.json"));
      if (
        !ciIsRecord(manifest) ||
        manifest.name !== "cloudigniter" ||
        manifest.private !== true
      ) {
        throw new CiDevUsageError(
          "dev requires the private cloudigniter pnpm workspace."
        );
      }
      return directory;
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "ENOENT"
      )
        throw error;
    }
    const parent = path.dirname(directory);
    if (parent === directory)
      throw new CiDevUsageError(
        "No CloudIgniter pnpm workspace found. Use --workspace-root."
      );
    directory = parent;
  }
}

/** @param {unknown} value @param {string} name @returns {string[]} */
function ciStrings(value, name) {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        typeof item === "string" && item.trim() === item && item.length > 0
    )
  ) {
    throw new CiDevUsageError(
      `${ciPolicyPath}: ${name} must be an array of nonempty strings.`
    );
  }
  return [...new Set(value)];
}

/** @param {string} root @returns {Promise<import('./types.d.mts').ReleasePolicy>} */
export async function ciReadPolicy(root) {
  let raw;
  try {
    raw = await ciReadJson(path.join(root, ciPolicyPath));
  } catch {
    throw new CiDevUsageError(
      `Create a valid ${ciPolicyPath} before requesting a release. See @cloudigniter/dev's README.`
    );
  }
  if (!ciIsRecord(raw) || raw.schemaVersion !== 1)
    throw new CiDevUsageError(
      "Unsupported release policy schema; expected schemaVersion 1."
    );
  const allowed = new Set([
    "schemaVersion",
    "repository",
    "baseBranch",
    "registry",
    "reviewers",
    "tags",
    "packages",
    "topology",
  ]);
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key))
      throw new CiDevUsageError(`Unknown release policy field: ${key}.`);
  }
  if (raw.topology !== undefined && raw.topology !== "paired")
    throw new CiDevUsageError("Unsupported release topology.");
  if (raw.topology === "paired" && raw.repository !== null)
    throw new CiDevUsageError(
      "Paired releases use each package source/build repository; leave repository null."
    );
  if (
    raw.repository !== null &&
    (typeof raw.repository !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(
        raw.repository
      ))
  ) {
    throw new CiDevUsageError(
      "repository must be a GitHub owner/repository slug or null."
    );
  }
  if (
    typeof raw.baseBranch !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(raw.baseBranch) ||
    /\.\.|\/\/|\.lock(?:\/|$)|[/.]$/.test(raw.baseBranch)
  ) {
    throw new CiDevUsageError("baseBranch must be a valid named Git branch.");
  }
  if (raw.registry !== "https://registry.npmjs.org")
    throw new CiDevUsageError(
      "This version supports only https://registry.npmjs.org."
    );
  const reviewers = ciStrings(raw.reviewers, "reviewers");
  if (
    reviewers.some(
      (name) =>
        !/^[A-Za-z0-9][A-Za-z0-9-]*(?:\/[A-Za-z0-9][A-Za-z0-9-]*)?$/.test(name)
    )
  ) {
    throw new CiDevUsageError(
      "reviewers must contain GitHub usernames or organization/team slugs."
    );
  }
  const tags = ciStrings(raw.tags, "tags");
  if (
    !tags.includes("latest") ||
    tags.some(
      (tag) => !/^[a-z][a-z0-9-]*$/.test(tag) || semver.validRange(tag) !== null
    )
  ) {
    throw new CiDevUsageError(
      "tags must include latest and use lowercase named channels such as beta or next."
    );
  }
  if (!ciIsRecord(raw.packages) || Object.keys(raw.packages).length === 0)
    throw new CiDevUsageError(
      "Release policy must allow at least one package."
    );
  /** @type {import('./types.d.mts').ReleasePolicy['packages']} */
  const packages = {};
  const paths = new Set();
  for (const [name, entry] of Object.entries(raw.packages)) {
    if (
      !/^@cloudigniter\/[a-z0-9][a-z0-9._-]*$/.test(name) ||
      !ciIsRecord(entry)
    )
      throw new CiDevUsageError(`Invalid package policy: ${name}.`);
    if (Object.keys(entry).some((key) => !["path", "access"].includes(key)))
      throw new CiDevUsageError(`Unknown policy field for ${name}.`);
    if (
      typeof entry.path !== "string" ||
      !/^packages\/[a-z0-9][a-z0-9_-]*$/.test(entry.path) ||
      paths.has(entry.path)
    ) {
      throw new CiDevUsageError(
        `${name}: path must identify a unique packages/<directory>.`
      );
    }
    if (entry.access !== "public" && entry.access !== "restricted")
      throw new CiDevUsageError(
        `${name}: access must be public or restricted.`
      );
    if (name === "@cloudigniter/dev" && entry.access !== "restricted")
      throw new CiDevUsageError("@cloudigniter/dev must remain restricted.");
    paths.add(entry.path);
    packages[name] = { path: entry.path, access: entry.access };
  }
  if (raw.topology === "paired") {
    const registry = await ciReadRepositories(root);
    if (registry.baseBranch !== raw.baseBranch)
      throw new CiDevUsageError(
        "Repository and release base branches must match."
      );
    for (const [name, entry] of Object.entries(packages)) {
      const project = Object.values(registry.projects).find(
        (item) => item.package === name
      );
      if (!project?.sourceRepository || project.sourcePath !== entry.path)
        throw new CiDevUsageError(
          `Configure the source/build repository pair for ${name}.`
        );
      entry.sourceRepository = project.sourceRepository;
      entry.buildRepository = project.buildRepository;
    }
  }
  return {
    schemaVersion: 1,
    repository: raw.repository,
    baseBranch: raw.baseBranch,
    registry: raw.registry,
    reviewers,
    tags,
    packages,
    ...(raw.topology === "paired" ? { topology: "paired" } : {}),
  };
}
