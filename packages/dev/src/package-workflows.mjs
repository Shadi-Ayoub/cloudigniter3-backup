import { mkdir, readFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fg from "fast-glob";
import { ciReadPackageConfig, ciPackageFile } from "./package-config.mjs";
import { ciRunLocalCommand, ciRunWorker } from "./maintainer-runtime.mjs";
import { CiDevUsageError } from "./runtime.mjs";

const require = createRequire(import.meta.url);
const tsx = pathToFileURL(require.resolve("tsx")).href;
const testRunner = fileURLToPath(
  new URL("./workers/internal/ci-test-package.mjs", import.meta.url),
);
const gateTest = fileURLToPath(
  new URL("./checks/package-build-gate.test.mjs", import.meta.url),
);

/** @type {Record<string, {usage: string, description: string, flags?: string[]}>} */
export const ciPackageCommands = {
  clean: {
    usage: "clean",
    description: "Remove dist and .tsbuildinfo from the current package.",
  },
  "clean-types": {
    usage: "clean-types",
    description: "Remove temporary declarations in dist/.types only.",
  },
  "build-js": {
    usage: "build-js",
    description: "Run the package generation hook, then tsup.config.ts.",
  },
  "build-types": {
    usage: "build-types",
    description: "Bundle declarations with Rollup (12 GiB heap limit).",
  },
  "build-types-raw": {
    usage: "build-types-raw",
    description: "Emit declarations using tsconfig.build.json.",
  },
  "build-assets": {
    usage: "build-assets",
    description:
      "Build configured themes/locales; report when no assets apply.",
  },
  watch: {
    usage: "watch",
    description:
      "Watch JavaScript with tsup; does not run the full build/quality gate.",
  },
  typecheck: {
    usage: "typecheck [--scope=source|tools|tests|all]",
    description:
      "Check without emitting; default source, all checks configured scopes.",
    flags: ["scope"],
  },
  test: {
    usage: "test [--watch | --coverage] [--filter=<text>]",
    description:
      "Run configured tests; repeat filters (OR). Coverage requires the full suite and a configured gate.",
    flags: ["watch", "coverage", "filter"],
  },
  "test-build-gate": {
    usage: "test-build-gate",
    description:
      "Verify failed quality gates preserve existing build artifacts.",
  },
  check: {
    usage: "check",
    description:
      "Run the package's configured quick checks in order; stop on failure.",
  },
  quality: {
    usage: "quality",
    description:
      "Run configured coverage, build-gate and typecheck requirements (currently Next).",
  },
  "check-package": {
    usage: "check-package",
    description: "Run package artifact validation, or npm pack --dry-run.",
  },
  "release-check": {
    usage: "release-check",
    description:
      "Run the package release-validation hook (currently Next); never publish.",
  },
  prepublish: {
    usage: "prepublish",
    description:
      "Run configured prepublish requirements; never approve or publish a release.",
  },
};

/** @param {string} cwd @param {string} file */
async function hook(cwd, file) {
  await ciRunLocalCommand({
    command: process.execPath,
    args: ["--import", tsx, await ciPackageFile(cwd, file)],
    cwd,
  });
}

/** @param {string} cwd */
export async function ciPreparePackageBuild(cwd) {
  const config = await ciReadPackageConfig(cwd, true);
  if (config.beforeBuild) await hook(cwd, config.beforeBuild);
}

/** @param {string} cwd @param {{watch?: boolean, filter?: string[]}} [options] */
export async function ciRunPackageTests(cwd, options = {}) {
  const config = await ciReadPackageConfig(cwd);
  if (!config.test)
    throw new CiDevUsageError("Tests are not configured for this package.");
  const suite = config.test;
  const files = (
    await fg(suite.files, {
      cwd,
      onlyFiles: true,
      followSymbolicLinks: false,
      ignore: ["**/._*"],
    })
  )
    .filter(
      (file) =>
        !options.filter?.length ||
        options.filter.some((selector) => file.includes(selector)),
    )
    .sort();
  if (!files.length)
    throw new CiDevUsageError(
      "No tests matched; refusing an empty successful run.",
    );
  const junit = path.join(cwd, "coverage/junit.xml");
  if (suite.requireNoSkipped && !options.watch) {
    await mkdir(path.dirname(junit), { recursive: true });
    await rm(junit, { force: true });
  }
  await ciRunLocalCommand({
    command: process.execPath,
    args: [
      ...(suite.typescript ? ["--import", tsx] : []),
      "--test",
      ...(suite.timeout ? [`--test-timeout=${suite.timeout}`] : []),
      ...(options.watch
        ? ["--watch"]
        : suite.requireNoSkipped
          ? [
              "--test-reporter=spec",
              "--test-reporter-destination=stdout",
              "--test-reporter=junit",
              `--test-reporter-destination=${junit}`,
            ]
          : []),
      ...files,
    ],
    cwd,
    env: suite.tsconfig
      ? { TSX_TSCONFIG_PATH: await ciPackageFile(cwd, suite.tsconfig) }
      : undefined,
  });
  if (suite.requireNoSkipped && !options.watch) {
    const report = await readFile(junit, "utf8");
    if (!report.includes("<testcase") || /<skipped\b/.test(report))
      throw new Error(
        "The required suite must execute tests with no skips or TODOs.",
      );
  }
}

/** @param {string} action
 * @param {{cwd: string, workspaceRoot: string, flags: import('./types.d.mts').MaintainerFlags}} context
 */
export async function ciRunPackageWorkflow(
  action,
  { cwd, workspaceRoot, flags },
) {
  const config = await ciReadPackageConfig(cwd);
  const run = (/** @type {string} */ step) =>
    ciRunPackageWorkflow(step, {
      cwd,
      workspaceRoot,
      flags: { interactive: false },
    });
  const worker = (/** @type {string} */ file) =>
    ciRunWorker({
      worker: `internal/build-steps/${file}`,
      workspaceRoot,
      verbose: flags.verbose,
    });
  if (action === "clean") {
    await rm(path.join(cwd, "dist"), { force: true, recursive: true });
    await rm(path.join(cwd, ".tsbuildinfo"), { force: true });
    console.log("Removed dist and .tsbuildinfo.");
  } else if (action === "clean-types") {
    await worker("ci-clean-types-temp.mjs");
  } else if (
    ["build-js", "build-types", "build-types-raw", "watch"].includes(action)
  ) {
    const file =
      action === "build-types"
        ? "rollup.config.js"
        : action === "build-types-raw"
          ? "tsconfig.build.json"
          : "tsup.config.ts";
    await ciPackageFile(cwd, file);
    if (action === "build-js" || action === "watch")
      await ciPreparePackageBuild(cwd);
    if (action === "watch")
      await ciRunLocalCommand({
        command: "tsup",
        args: ["--config", "tsup.config.ts", "--watch"],
        cwd,
      });
    else await worker(`ci-${action}.mjs`);
  } else if (action === "build-assets") {
    if (config.assets) await worker("ci-build-next-app-assets.mjs");
    else console.log("No package assets configured.");
  } else if (action.startsWith("typecheck")) {
    const scope =
      action === "typecheck-tools"
        ? "tools"
        : action === "typecheck-tests"
          ? "tests"
          : (flags.scope ?? "source");
    const scopes = scope === "all" ? (config.typecheck ?? []) : [scope];
    if (
      !scopes.length ||
      scopes.some(
        (item) =>
          !config.typecheck?.includes(
            /** @type {'source'|'tools'|'tests'} */ (item),
          ),
      )
    )
      throw new CiDevUsageError(
        `Typecheck scope ${scope} is not configured for this package.`,
      );
    for (const item of scopes) {
      const file =
        item === "source"
          ? "tsconfig.json"
          : `tsconfig.${item === "tests" ? "test" : item}.json`;
      await ciPackageFile(cwd, file);
      console.log(`Typechecking ${file}...`);
      await ciRunLocalCommand({
        command: "tsc",
        args: ["-p", file, "--noEmit"],
        cwd,
      });
    }
  } else if (action === "test" || action === "test-coverage") {
    const coverage = action === "test-coverage" || flags.coverage;
    if (coverage && (flags.watch || flags.filter?.length))
      throw new CiDevUsageError(
        "Coverage requires the complete suite without --watch or --filter.",
      );
    if (!config.test)
      throw new CiDevUsageError("Tests are not configured for this package.");
    if (coverage) {
      if (!config.coverageCheck)
        throw new CiDevUsageError(
          "Coverage is not configured for this package.",
        );
      await ciPackageFile(cwd, config.coverageCheck);
      await ciRunLocalCommand({
        command: "c8",
        args: [process.execPath, testRunner],
        cwd,
      });
      await hook(cwd, config.coverageCheck);
    } else await ciRunPackageTests(cwd, flags);
  } else if (action === "test-build-gate") {
    await ciRunLocalCommand({
      command: process.execPath,
      args: ["--test", gateTest],
      cwd,
    });
  } else if (action === "check-package") {
    if (config.packageCheck) await hook(cwd, config.packageCheck);
    else
      await ciRunLocalCommand({
        command: "npm",
        args: ["pack", "--dry-run"],
        cwd,
      });
  } else if (action === "release-check") {
    if (!config.releaseCheck)
      throw new CiDevUsageError(
        "Release checks are not configured for this package.",
      );
    await hook(cwd, config.releaseCheck);
  } else if (
    action === "check" ||
    action === "quality" ||
    action === "prepublish"
  ) {
    const recipe = config[action];
    if (!recipe?.length)
      throw new CiDevUsageError(
        `${action} is not configured for this package.`,
      );
    for (const step of recipe) {
      console.log(`[dev package ${action}] ${step}`);
      await run(step);
    }
  } else throw new CiDevUsageError(`Unknown package workflow: ${action}`);
}
