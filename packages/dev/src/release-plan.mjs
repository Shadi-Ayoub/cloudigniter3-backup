import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { realpath } from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import { getPackages } from "@manypkg/get-packages";
import { read as readConfig } from "@changesets/config";
import { readPreState } from "@changesets/pre";
import { ciReadPolicy } from "./policy.mjs";
import { CiDevUsageError } from "./runtime.mjs";

// These Changesets functions are exposed as CommonJS `exports.default`.
const require = createRequire(import.meta.url);
/** @type {typeof import('@changesets/assemble-release-plan')} */
const assembler = require("@changesets/assemble-release-plan");
/** @type {typeof import('@changesets/read')} */
const reader = require("@changesets/read");

/** @param {unknown} value */
export function ciDigest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** @param {string} intent @param {string} version @returns {'patch' | 'minor' | 'major'} */
function ciBump(intent, version) {
  switch (intent) {
    case "fix":
    case "patch":
      return "patch";
    case "feature":
    case "minor":
      return "minor";
    case "major":
      return "major";
    case "breaking":
      return semver.major(version) === 0 ? "minor" : "major";
    case "initial":
      if (!semver.prerelease(version) && semver.lt(version, "0.1.0"))
        return "minor";
      throw new CiDevUsageError(
        "initial only proposes 0.1.0 for packages currently below 0.1.0. Bootstrap already-versioned packages separately."
      );
    default:
      throw new CiDevUsageError(
        `Unknown release intent: ${intent}. Use fix, feature, breaking, patch, minor, major, or initial.`
      );
  }
}

/** @param {string} root @param {import('./types.d.mts').PlanOptions} options @returns {Promise<import('./types.d.mts').ReleaseProposal>} */
export async function ciCreateReleasePlan(root, options) {
  root = await realpath(root);
  const policy = await ciReadPolicy(root);
  const workspace = await getPackages(root);
  if ((await realpath(workspace.root.dir)) !== (await realpath(root)))
    throw new CiDevUsageError("Release policy must be at the workspace root.");
  const config = await readConfig(root, workspace);
  if (config.baseBranch !== policy.baseBranch)
    throw new CiDevUsageError(
      "Changesets baseBranch and release policy baseBranch must match."
    );
  const existing = await reader.default(root);
  const selected = [...new Set(options.packages ?? [])].sort();
  if (options.changed) {
    if (selected.length || options.intent || options.preid)
      throw new CiDevUsageError(
        "--changed consumes existing Changesets; do not combine it with a bump, --package, or --preid."
      );
    if (existing.length === 0)
      throw new CiDevUsageError(
        "No pending Changesets. Select --package and a release intent."
      );
  } else if (!options.intent || selected.length === 0) {
    throw new CiDevUsageError(
      "Specify a release intent and at least one --package, or use --changed."
    );
  }
  if (
    options.access &&
    !["public", "private", "restricted"].includes(options.access)
  )
    throw new CiDevUsageError(
      "--access must be public, private, or restricted."
    );
  const requestedAccess =
    options.access === "private" ? "restricted" : options.access;
  const byName = new Map(
    workspace.packages.map((pkg) => [pkg.packageJson.name, pkg])
  );
  for (const name of selected) {
    if (!policy.packages[name] || !byName.has(name))
      throw new CiDevUsageError(
        `Package is not allowed by release policy: ${name}. Use the full @cloudigniter name.`
      );
    if (byName.get(name)?.packageJson.private)
      throw new CiDevUsageError(
        `${name} has private:true, which prevents all npm publication. Use publishConfig.access for restricted packages.`
      );
  }
  const summary =
    options.summary?.trim() ||
    (options.changed
      ? "Release pending Changesets."
      : `${options.intent} release for ${selected.join(", ")}.`);
  if (summary.length > 4000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(summary))
    throw new CiDevUsageError(
      "Summary must contain at most 4000 characters and no terminal control characters."
    );
  /** @type {import('./types.d.mts').NewChangeset | null} */
  let newChangeset = null;
  if (!options.changed) {
    const releases = selected.map((name) => {
      const version = byName.get(name)?.packageJson.version;
      if (!version || !semver.valid(version))
        throw new CiDevUsageError(`${name} has an invalid version.`);
      return { name, type: ciBump(options.intent ?? "", version) };
    });
    newChangeset = {
      id: `dev-${ciDigest({ releases, summary }).slice(0, 20)}`,
      summary,
      releases,
    };
    if (existing.some((item) => item.id === newChangeset?.id))
      throw new CiDevUsageError(
        "This release intent is already recorded. Use --changed."
      );
  }
  let preState = await readPreState(root);
  /** @type {import('./types.d.mts').PreState | null} */
  let enterPreState = null;
  if (options.preid) {
    if (
      !/^[a-z][a-z0-9-]*$/.test(options.preid) ||
      !policy.tags.includes(options.preid) ||
      options.preid === "latest"
    )
      throw new CiDevUsageError(
        "--preid must be an allowed prerelease channel, such as beta."
      );
    if (preState && (preState.tag !== options.preid || preState.mode !== "pre"))
      throw new CiDevUsageError(
        "A different Changesets prerelease cycle already exists. Finish it before changing --preid."
      );
    if (!preState) {
      preState = {
        mode: "pre",
        tag: options.preid,
        initialVersions: Object.fromEntries(
          workspace.packages.map((pkg) => [
            pkg.packageJson.name,
            pkg.packageJson.version,
          ])
        ),
        changesets: [],
      };
      enterPreState = structuredClone(preState);
    }
  }
  const changesets = newChangeset ? [...existing, newChangeset] : existing;
  const calculated = assembler.default(changesets, workspace, config, preState);
  const tag =
    options.tag ?? (preState?.mode === "pre" ? preState.tag : "latest");
  if (!policy.tags.includes(tag))
    throw new CiDevUsageError(`Tag ${tag} is not allowed by release policy.`);
  /** @type {import('./types.d.mts').PlannedRelease[]} */
  const releases = [];
  for (const release of calculated.releases) {
    if (release.type === "none") continue;
    const entry = policy.packages[release.name];
    const pkg = byName.get(release.name);
    if (!entry || !pkg)
      throw new CiDevUsageError(
        `Dependency propagation includes ${release.name}, which is not allowed by release policy. Review its ownership before releasing.`
      );
    const expected = path.join(root, entry.path);
    if (pkg.dir !== expected || (await realpath(expected)) !== expected)
      throw new CiDevUsageError(
        `${release.name}: package path differs from policy or uses a symlink.`
      );
    if (pkg.packageJson.private)
      throw new CiDevUsageError(
        `${release.name} has private:true, which prevents all npm publication. Use publishConfig.access for restricted packages.`
      );
    const published = pkg.packageJson.publishConfig;
    if (
      (published?.access && published.access !== entry.access) ||
      (published?.registry && published.registry !== policy.registry) ||
      published?.directory
    ) {
      throw new CiDevUsageError(
        `${release.name}: publishConfig conflicts with release policy or uses unsupported directory publishing.`
      );
    }
    if (requestedAccess && requestedAccess !== entry.access)
      throw new CiDevUsageError(
        `${release.name}: --access conflicts with approved ${entry.access} visibility. Change policy through a separate review.`
      );
    if (tag === "latest" && semver.prerelease(release.newVersion))
      throw new CiDevUsageError("Prereleases cannot use the latest tag.");
    releases.push({
      name: release.name,
      path: entry.path,
      type: release.type,
      oldVersion: release.oldVersion,
      newVersion: release.newVersion,
      access: entry.access,
      reason: selected.includes(release.name)
        ? "requested"
        : existing.some((cs) =>
            cs.releases.some((item) => item.name === release.name)
          )
        ? "pending-changeset"
        : "dependency",
    });
  }
  if (releases.length === 0)
    throw new CiDevUsageError(
      "No publishable releases were calculated. Check ignored packages and consumed prerelease Changesets."
    );
  for (const name of selected) {
    if (!releases.some((release) => release.name === name))
      throw new CiDevUsageError(
        `${name} was excluded by Changesets configuration.`
      );
    if (
      options.intent === "initial" &&
      releases.find((release) => release.name === name)?.newVersion !== "0.1.0"
    )
      throw new CiDevUsageError(
        "initial must resolve to exactly 0.1.0. Resolve pending bumps or prerelease state before requesting bootstrap intent."
      );
  }
  const warnings = [
    "This is a release proposal, not approval or a built package. Registry version availability has not been checked.",
  ];
  if (releases.some((release) => release.name === "@cloudigniter/next"))
    warnings.push(
      "@cloudigniter/next requires quality:next and release:check:next before artifact approval."
    );
  if (existing.length && !options.changed)
    warnings.push(
      "The proposal includes all pending Changesets, including changes to packages outside --package."
    );
  return {
    schemaVersion: 1,
    repository: policy.repository,
    baseBranch: policy.baseBranch,
    registry: policy.registry,
    tag,
    summary,
    intent: options.changed ? "changed" : options.intent ?? "",
    releases: releases.sort((a, b) => a.name.localeCompare(b.name)),
    changesetIds: changesets.map((item) => item.id).sort(),
    newChangeset,
    enterPreState,
    warnings,
    ...(policy.topology === "paired"
      ? {
          destinations: releases.map((release) => ({
            name: release.name,
            sourceRepository: String(
              policy.packages[release.name].sourceRepository
            ),
            buildRepository: String(
              policy.packages[release.name].buildRepository
            ),
          })),
        }
      : {}),
  };
}

/** @param {import('./types.d.mts').NewChangeset} changeset */
export function ciSerializeChangeset(changeset) {
  return `---\n${changeset.releases
    .map((release) => `${JSON.stringify(release.name)}: ${release.type}`)
    .join("\n")}\n---\n\n${changeset.summary}\n`;
}

/** @param {import('./types.d.mts').ReleaseProposal} plan */
export function ciFormatPlan(plan) {
  return [
    "CloudIgniter release proposal",
    "",
    ...plan.releases.map(
      (release) =>
        `${release.name}: ${release.oldVersion} -> ${release.newVersion} (${release.access}; ${release.reason})`
    ),
    "",
    `Tag: ${plan.tag}`,
    `Registry: ${plan.registry}`,
    ...(plan.destinations
      ? plan.destinations.map(
          (entry) =>
            `${entry.name}: ${entry.sourceRepository} → ${entry.buildRepository} (${plan.baseBranch})`
        )
      : [
          `GitHub: ${plan.repository ?? "not configured"} (${plan.baseBranch})`,
        ]),
    "",
    ...plan.warnings,
  ].join("\n");
}
