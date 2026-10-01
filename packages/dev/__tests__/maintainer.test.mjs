import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const bin = path.resolve(import.meta.dirname, "../bin/dev.mjs");
const ciBin = path.resolve(import.meta.dirname, "../../cli/bin/ci.mjs");
const invoke = (args, cwd = tmpdir()) =>
  spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });

async function workspace(t, qualityExit = 0) {
  const root = await mkdtemp(path.join(tmpdir(), "dev-maintainer-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cwd = path.join(root, "packages/example");
  await mkdir(path.join(cwd, "scripts"), { recursive: true });
  await mkdir(path.join(root, "packages/dev"), { recursive: true });
  await mkdir(path.join(cwd, "dist"));
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "cloudigniter", private: true })
  );
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    "packages:\n  - packages/*\n"
  );
  await writeFile(
    path.join(root, "packages/dev/package.json"),
    JSON.stringify({ name: "@cloudigniter/dev" })
  );
  await writeFile(
    path.join(cwd, "package.json"),
    JSON.stringify({
      name: "@cloudigniter/example",
      scripts: { quality: `node -e "process.exit(${qualityExit})"` },
    })
  );
  await writeFile(path.join(cwd, "dist/previous-build"), "preserve on failure");
  await writeFile(
    path.join(cwd, "scripts/ci-build-package.config.mjs"),
    `export default ${JSON.stringify({
      qualityScript: "quality",
      steps: {
        dev: [{ file: "ci-clean.mjs", message: "clean" }],
        prod: [{ file: "ci-clean.mjs", message: "clean" }],
      },
    })};\n`
  );
  return { root, cwd };
}

test("dev help combines release and maintainer commands outside the workspace", () => {
  const result = invoke(["--help"]);
  assert.equal(result.status, 0, result.stderr);
  for (const command of [
    "npm publish",
    "package build",
    "quality scan-client-directives",
    "next build-theme",
    "modules sync",
  ])
    assert.ok(result.stdout.includes(command), command);
  assert.doesNotMatch(
    result.stdout,
    /resources studio|amplify sandbox deploy|ci-dev package/
  );
});

test("maintainer commands reject consumer projects", async (t) => {
  const { root, cwd } = await workspace(t);
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "consumer", private: true })
  );
  const result = invoke(["package", "build", "--mode=dev"], cwd);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /private cloudigniter|CloudIgniter.*workspace/i);
  await access(path.join(cwd, "dist/previous-build"));
});

for (const mode of ["dev", "prod"]) {
  test(`dev package build ${mode} preserves artifacts on a failed quality gate`, async (t) => {
    const { cwd } = await workspace(t, 23);
    const result = invoke(
      ["package", "build", `--mode=${mode}`, "--no-interactive"],
      cwd
    );
    assert.equal(result.status, 23, result.stdout + result.stderr);
    await access(path.join(cwd, "dist/previous-build"));
  });

  test(`dev package build ${mode} executes the migrated pipeline without release policy`, async (t) => {
    const { cwd } = await workspace(t);
    const result = invoke(
      ["package", "build", `--mode=${mode}`, "--no-interactive"],
      cwd
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    await assert.rejects(access(path.join(cwd, "dist/previous-build")));
  });
}

test("maintainer parser rejects missing input, extra operands and unrelated flags before writing", async (t) => {
  const { cwd } = await workspace(t);
  for (const args of [
    ["package", "build", "--no-interactive"],
    ["package", "build", "--mode=invalid"],
    ["package", "clean-maps", "extra"],
    ["package", "clean-maps", "--dry-run"],
    ["package", "clean-maps", "--mode=dev"],
    ["modules", "sync", "--tag=latest"],
    ["npm", "plan", "fix", "--mode=dev"],
  ]) {
    const result = invoke(args, cwd);
    assert.equal(
      result.status,
      2,
      `${args.join(" ")}: ${result.stdout}${result.stderr}`
    );
    await access(path.join(cwd, "dist/previous-build"));
  }
});

test("migrated clean-maps operates on the invoking package", async (t) => {
  const { root, cwd } = await workspace(t);
  await writeFile(path.join(cwd, "dist/example.js.map"), "{}");
  await mkdir(path.join(root, "dist"));
  await writeFile(path.join(root, "dist/keep.js.map"), "{}");
  const result = invoke(["package", "clean-maps"], cwd);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  await assert.rejects(access(path.join(cwd, "dist/example.js.map")));
  assert.equal(
    await readFile(path.join(root, "dist/keep.js.map"), "utf8"),
    "{}"
  );
});

async function modules(t) {
  const result = await workspace(t);
  const { root } = result;
  await mkdir(path.join(root, "packages/core/src/lib/module"), {
    recursive: true,
  });
  await writeFile(
    path.join(root, "packages/core/src/lib/module/index.ts"),
    "export const ciCollectModulePackageDependencies = () => [];\nexport const ciResolveModuleGraph = () => [];\n"
  );
  await mkdir(path.join(root, "packages/next/src/modules"), {
    recursive: true,
  });
  await writeFile(
    path.join(root, "packages/next/package.json"),
    JSON.stringify({ name: "@cloudigniter/next" })
  );
  return result;
}

test("maintainer module validation and public application validation share the validator", async (t) => {
  const { root } = await modules(t);
  const core = invoke(["modules", "validate", "--kind=core"], root);
  assert.equal(core.status, 0, core.stdout + core.stderr);
  assert.match(core.stdout, /Validated 0 core Module/);
  const user = spawnSync(
    process.execPath,
    [ciBin, "modules", "validate", "--root=src/modules", "--no-interactive"],
    { cwd: root, encoding: "utf8" }
  );
  assert.equal(user.status, 0, user.stdout + user.stderr);
  assert.match(user.stdout, /No application modules directory/);
});

test("module sync check reports drift without editing or installing", async (t) => {
  const { root } = await modules(t);
  const manifestPath = path.join(root, "packages/next/package.json");
  const before = await readFile(manifestPath, "utf8");
  const clean = invoke(["modules", "sync", "--check"], root);
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  await writeFile(
    path.join(root, "packages/core/src/lib/module/index.ts"),
    "export const ciCollectModulePackageDependencies = () => [{name: 'example', specifier: '1.0.0', sections: ['dependencies']}];\n"
  );
  const drift = invoke(["modules", "sync", "--check"], root);
  assert.equal(drift.status, 1, drift.stdout + drift.stderr);
  assert.match(drift.stderr, /not synchronized/);
  assert.equal(await readFile(manifestPath, "utf8"), before);
});

test("private package owns build tooling while public CLI exposes shared application tooling", async () => {
  const { ENTRY_KIND } = await import("@cloudigniter/dev/tooling/entries");
  const { ciInjectUseClient } = await import(
    "@cloudigniter/dev/tooling/inject-use-client"
  );
  const { ciValidateModules } = await import(
    "@cloudigniter/cli/tooling/modules"
  );
  assert.equal(ENTRY_KIND.CLIENT, "client");
  assert.equal(typeof ciInjectUseClient, "function");
  assert.equal(typeof ciValidateModules, "function");
  await assert.rejects(import("@cloudigniter/cli/tooling/entries"), {
    code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
  });
});
