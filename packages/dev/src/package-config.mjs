import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { ciIsRecord } from "./policy.mjs";
import { CiDevUsageError } from "./runtime.mjs";

const steps = [
  "typecheck",
  "typecheck-tools",
  "typecheck-tests",
  "test",
  "test-coverage",
  "test-build-gate",
  "check-package",
];
/** @param {unknown} value */
function strings(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.length > 0)
  );
}
/** @param {string} value */
function localPath(value) {
  return (
    !path.isAbsolute(value) &&
    !value.split(/[\\/]/).includes("..") &&
    !value.startsWith("!")
  );
}

/** Package commands must run at a company package root, never at the workspace or a nested directory.
 * @param {string} cwd @param {string} workspaceRoot
 */
export async function ciAssertPackageDirectory(cwd, workspaceRoot) {
  const real = await realpath(cwd);
  const packages = await realpath(path.join(workspaceRoot, "packages"));
  if (path.dirname(real) !== packages)
    throw new CiDevUsageError(
      "Run dev package commands from a CloudIgniter package directory (packages/<name>), or use pnpm --filter <package> exec dev.",
    );
  const manifest = JSON.parse(
    await readFile(path.join(real, "package.json"), "utf8"),
  );
  if (
    !ciIsRecord(manifest) ||
    typeof manifest.name !== "string" ||
    !manifest.name.startsWith("@cloudigniter/")
  )
    throw new CiDevUsageError("Expected a @cloudigniter package manifest.");
}

/** @param {string} cwd @param {boolean} [optional]
 * @returns {Promise<import('./package-workflow-types.d.mts').CiPackageWorkflowConfig>}
 */
export async function ciReadPackageConfig(cwd, optional = false) {
  const file = path.join(cwd, "ci-dev.config.json");
  let config;
  try {
    config = JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (optional && ciIsRecord(error) && error.code === "ENOENT")
      return { schemaVersion: 1 };
    throw new CiDevUsageError(
      `Cannot read ${file}. Add a valid ci-dev.config.json for this package.`,
    );
  }
  const fail = () => {
    throw new CiDevUsageError(
      `Invalid ci-dev.config.json in ${cwd}: check schemaVersion, supported fields, local hook paths and non-recursive check/quality/prepublish steps.`,
    );
  };
  if (!ciIsRecord(config) || config.schemaVersion !== 1) return fail();
  const allowed = [
    "schemaVersion",
    "typecheck",
    "test",
    "beforeBuild",
    "coverageCheck",
    "packageCheck",
    "releaseCheck",
    "assets",
    "check",
    "quality",
    "prepublish",
  ];
  if (Object.keys(config).some((key) => !allowed.includes(key))) return fail();
  if (
    config.typecheck !== undefined &&
    (!strings(config.typecheck) ||
      !Array.isArray(config.typecheck) ||
      config.typecheck.some(
        (value) => !["source", "tools", "tests"].includes(value),
      ))
  )
    return fail();
  for (const key of [
    "beforeBuild",
    "coverageCheck",
    "packageCheck",
    "releaseCheck",
  ]) {
    const value = config[key];
    if (
      value !== undefined &&
      (typeof value !== "string" || !value || !localPath(value))
    )
      return fail();
  }
  if (config.assets !== undefined && typeof config.assets !== "boolean")
    return fail();
  for (const [key, allowedSteps] of Object.entries({
    check: steps,
    quality: [...steps, "check"],
    prepublish: [...steps, "check", "quality"],
  })) {
    const value = config[key];
    if (
      value !== undefined &&
      (!strings(value) ||
        !Array.isArray(value) ||
        value.some((item) => !allowedSteps.includes(item)))
    )
      return fail();
  }
  if (config.test !== undefined) {
    const value = config.test;
    if (
      !ciIsRecord(value) ||
      !strings(value.files) ||
      !Array.isArray(value.files) ||
      value.files.some((file) => !localPath(file))
    )
      return fail();
    if (
      Object.keys(value).some(
        (key) =>
          ![
            "files",
            "typescript",
            "tsconfig",
            "timeout",
            "requireNoSkipped",
          ].includes(key),
      )
    )
      return fail();
    for (const key of ["typescript", "requireNoSkipped"])
      if (value[key] !== undefined && typeof value[key] !== "boolean")
        return fail();
    if (
      value.tsconfig !== undefined &&
      (typeof value.tsconfig !== "string" || !localPath(value.tsconfig))
    )
      return fail();
    if (
      value.timeout !== undefined &&
      (typeof value.timeout !== "number" ||
        !Number.isSafeInteger(value.timeout) ||
        value.timeout < 1)
    )
      return fail();
  }
  // The checks above validate every field before the data crosses this boundary.
  return /** @type {import('./package-workflow-types.d.mts').CiPackageWorkflowConfig} */ ({
    ...config,
    schemaVersion: 1,
  });
}

/** Resolve a configured file without escaping its package through symlinks.
 * @param {string} cwd @param {string} file
 */
export async function ciPackageFile(cwd, file) {
  const root = await realpath(cwd);
  let target;
  try {
    target = await realpath(path.resolve(root, file));
  } catch {
    throw new CiDevUsageError(`Required package file is missing: ${file}`);
  }
  if (!localPath(file) || !target.startsWith(root + path.sep))
    throw new CiDevUsageError(
      `Configured file must stay inside the package: ${file}`,
    );
  return target;
}
