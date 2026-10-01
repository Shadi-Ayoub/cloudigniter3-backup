import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fixture } from "./fixtures.mjs";

const bin = path.resolve(import.meta.dirname, "../bin/dev.mjs");
const invoke = (cwd, ...args) => {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: "utf8",
    env,
  });
};
async function setup(t, config = {}) {
  const { root, json } = await fixture(t);
  const cwd = path.join(root, "packages/core");
  await json("packages/core/ci-dev.config.json", {
    schemaVersion: 1,
    ...config,
  });
  return { root, cwd, json };
}

test("both help spellings describe company package workflows outside the workspace", () => {
  for (const flag of ["--help", "-h"]) {
    const result = invoke("/tmp", flag);
    assert.equal(result.status, 0, result.stderr);
    for (const command of [
      "package clean",
      "package test",
      "--coverage",
      "package typecheck",
      "--scope",
      "package quality",
      "package check-package",
      "package release-check",
      "package watch",
      "package prepublish",
      "package build-js",
      "package build-types-raw",
      "package test-build-gate",
    ])
      assert.ok(result.stdout.includes(command), command);
  }
});

test("clean removes only package build artifacts; workspace root is refused", async (t) => {
  const { root, cwd } = await setup(t);
  await mkdir(path.join(cwd, "dist"));
  await writeFile(path.join(cwd, "dist/old.js"), "old");
  await writeFile(path.join(cwd, ".tsbuildinfo"), "old");
  await writeFile(path.join(cwd, "keep.txt"), "source");
  let result = invoke(root, "package", "clean");
  assert.equal(result.status, 2, result.stderr);
  result = invoke(cwd, "package", "clean");
  assert.equal(result.status, 0, result.stderr);
  await assert.rejects(access(path.join(cwd, "dist")));
  await assert.rejects(access(path.join(cwd, ".tsbuildinfo")));
  assert.equal(await readFile(path.join(cwd, "keep.txt"), "utf8"), "source");
});

test("test discovery preserves configured suites, rejects empty filters and propagates failure", async (t) => {
  const { cwd } = await setup(t, {
    test: { files: ["__tests__/chosen/*.test.mjs"] },
  });
  await mkdir(path.join(cwd, "__tests__/chosen"), { recursive: true });
  await writeFile(
    path.join(cwd, "__tests__/chosen/pass.test.mjs"),
    'import test from "node:test"; test("executes", () => {});',
  );
  await writeFile(
    path.join(cwd, "__tests__/excluded.test.mjs"),
    'throw new Error("must not run");',
  );
  let result = invoke(cwd, "package", "test");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  result = invoke(cwd, "package", "test", "--filter=missing");
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /No tests matched/);
  await writeFile(
    path.join(cwd, "__tests__/chosen/fail.test.mjs"),
    'import test from "node:test"; test("fails", () => { throw new Error("expected"); });',
  );
  result = invoke(cwd, "package", "test");
  assert.equal(result.status, 1, result.stdout + result.stderr);
});

test("strict suites reject skipped tests and clear stale JUnit before running", async (t) => {
  const { cwd } = await setup(t, {
    test: { files: ["*.test.mjs"], requireNoSkipped: true },
  });
  await writeFile(
    path.join(cwd, "skip.test.mjs"),
    'import test from "node:test"; test.skip("skipped", () => {});',
  );
  const result = invoke(cwd, "package", "test");
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /no skips or TODOs/);
});

test("recursive discovery executes deeply nested tests and rejects TODOs", async (t) => {
  const { cwd } = await setup(t, {
    test: {
      files: ["__tests__/**/*.test.{ts,tsx,cjs,mjs}"],
      requireNoSkipped: true,
    },
  });
  await mkdir(path.join(cwd, "__tests__/nested/deeper"), { recursive: true });
  const file = path.join(cwd, "__tests__/nested/deeper/fixture.test.mjs");
  await writeFile(
    file,
    'import test from "node:test"; test("nested fixture", () => {});',
  );
  let result = invoke(cwd, "package", "test");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /nested fixture/);
  await writeFile(
    file,
    'import test from "node:test"; test.todo("unfinished", () => {});',
  );
  result = invoke(cwd, "package", "test");
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /no skips or TODOs/);
});

test("unsupported coverage, filtered coverage and conflicting test modes fail before executing tests", async (t) => {
  const { cwd } = await setup(t, { test: { files: ["*.test.mjs"] } });
  await writeFile(
    path.join(cwd, "sentinel.test.mjs"),
    'import {writeFileSync} from "node:fs"; writeFileSync("executed", "bad");',
  );
  for (const flags of [
    ["--coverage"],
    ["--watch", "--coverage"],
    ["--coverage", "--filter=sentinel"],
    ["--scope=tests"],
  ]) {
    const result = invoke(cwd, "package", "test", ...flags);
    assert.equal(result.status, 2, result.stdout + result.stderr);
    await assert.rejects(access(path.join(cwd, "executed")));
  }
});

test("quality fails closed when not configured; invalid recursive recipes are refused", async (t) => {
  const { cwd, json } = await setup(t);
  let result = invoke(cwd, "package", "quality");
  assert.equal(result.status, 2, result.stderr);
  await json("packages/core/ci-dev.config.json", {
    schemaVersion: 1,
    quality: ["quality"],
  });
  result = invoke(cwd, "package", "quality");
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /quality/);
});

test("quality stops at a failed coverage gate before later checks", async (t) => {
  const { cwd } = await setup(t, {
    test: { files: ["*.test.mjs"] },
    coverageCheck: "gate.mjs",
    quality: ["test-coverage", "check-package"],
    packageCheck: "pack.mjs",
  });
  // Simulated c8 executes its child so this tests orchestration without collecting coverage.
  await mkdir(path.join(cwd, "node_modules/.bin"), { recursive: true });
  await writeFile(
    path.join(cwd, "node_modules/.bin/c8"),
    '#!/bin/sh\nexec "$@"\n',
    { mode: 0o755 },
  );
  await writeFile(
    path.join(cwd, "pass.test.mjs"),
    'import test from "node:test"; test("pass", () => {});',
  );
  await writeFile(path.join(cwd, "gate.mjs"), "process.exit(23);");
  await writeFile(
    path.join(cwd, "pack.mjs"),
    'import {writeFileSync} from "node:fs"; writeFileSync("packed", "bad");',
  );
  const result = invoke(cwd, "package", "quality");
  assert.equal(result.status, 23, result.stdout + result.stderr);
  await assert.rejects(access(path.join(cwd, "packed")));
});

test("all typecheck scopes use their package configs without emitting; unsupported scopes are refused", async (t) => {
  const { cwd, json } = await setup(t, {
    typecheck: ["source", "tools", "tests"],
  });
  await mkdir(path.join(cwd, "node_modules/.bin"), { recursive: true });
  for (const file of [
    "tsconfig.json",
    "tsconfig.tools.json",
    "tsconfig.test.json",
  ])
    await writeFile(path.join(cwd, file), "{}");
  await writeFile(
    path.join(cwd, "node_modules/.bin/tsc"),
    `#!${process.execPath}\nimport {appendFileSync} from "node:fs"; appendFileSync("invocations", JSON.stringify(process.argv.slice(2))+"\\n");\n`,
    { mode: 0o755 },
  );
  let result = invoke(cwd, "package", "typecheck", "--scope=all");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(
    (await readFile(path.join(cwd, "invocations"), "utf8"))
      .trim()
      .split("\n")
      .map(JSON.parse),
    [
      ["-p", "tsconfig.json", "--noEmit"],
      ["-p", "tsconfig.tools.json", "--noEmit"],
      ["-p", "tsconfig.test.json", "--noEmit"],
    ],
  );
  await json("packages/core/ci-dev.config.json", {
    schemaVersion: 1,
    typecheck: ["source"],
  });
  result = invoke(cwd, "package", "typecheck", "--scope=tests");
  assert.equal(result.status, 2, result.stderr);
});

test("full builds run package generation once and stop before cleanup when generation fails", async (t) => {
  const { cwd } = await setup(t, { beforeBuild: "generate.mjs" });
  await mkdir(path.join(cwd, "scripts"));
  await mkdir(path.join(cwd, "dist"));
  const hook = path.join(cwd, "generate.mjs");
  await writeFile(
    hook,
    'import {appendFileSync} from "node:fs"; appendFileSync("generated", "once\\n");',
  );
  const step = { file: "ci-clean.mjs", message: "clean" };
  await writeFile(
    path.join(cwd, "scripts/ci-build-package.config.mjs"),
    `export default ${JSON.stringify({ steps: { dev: [step], prod: [step] } })};`,
  );
  let result = invoke(cwd, "package", "build", "--mode=dev");
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(await readFile(path.join(cwd, "generated"), "utf8"), "once\n");
  await mkdir(path.join(cwd, "dist"));
  await writeFile(path.join(cwd, "dist/previous"), "keep");
  await writeFile(hook, "process.exit(24);");
  result = invoke(cwd, "package", "build", "--mode=prod");
  assert.equal(result.status, 24, result.stdout + result.stderr);
  await access(path.join(cwd, "dist/previous"));
});

test("prepublish runs its configured artifact hook after checks and preserves hook exit codes", async (t) => {
  const { cwd } = await setup(t, {
    test: { files: ["*.test.mjs"] },
    check: ["test"],
    prepublish: ["check", "check-package"],
    packageCheck: "artifact.mjs",
  });
  await writeFile(
    path.join(cwd, "passing.test.mjs"),
    'import test from "node:test"; test("pass", () => {});',
  );
  await writeFile(path.join(cwd, "artifact.mjs"), "process.exit(27);");
  const result = invoke(cwd, "package", "prepublish");
  assert.equal(result.status, 27, result.stdout + result.stderr);
});
