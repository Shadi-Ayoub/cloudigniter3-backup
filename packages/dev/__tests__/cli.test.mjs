import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { fixture } from "./fixtures.mjs";
import { ciGithubCliRelease } from "../src/github-cli-release.mjs";

const bin = fileURLToPath(new URL("../bin/dev.mjs", import.meta.url));
const invoke = (args, cwd = tmpdir()) =>
  spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8" });

test("help and version work outside a CloudIgniter workspace", () => {
  for (const args of [[], ["--help"], ["npm", "publish", "--help"]]) {
    const result = invoke(args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Does not publish to npm/);
    assert.doesNotMatch(result.stdout, /ci-dev package/);
  }
  const version = invoke(["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout.trim(), "0.1.0");
});

test("dry-run emits machine-readable output without git or GitHub configuration", async (t) => {
  const { root, json, policy } = await fixture(t);
  await json(".cloudigniter/release-policy.json", {
    ...policy,
    repository: null,
    reviewers: [],
  });
  const result = invoke(
    [
      "npm",
      "publish",
      "fix",
      "--package",
      "@cloudigniter/core",
      "--dry-run",
      "--json",
      "--no-interactive",
    ],
    path.join(root, "packages/core"),
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).releases[0].newVersion, "0.1.1");
});

for (const args of [
  ["npm", "publish", "fix", "--force"],
  ["npm", "unpublish"],
  ["npm", "publish", "fix", "extra"],
  ["npm", "publish", "--registry", "https://elsewhere.invalid"],
]) {
  test(`rejects unsupported command or flag: ${args.join(" ")}`, () => {
    const result = invoke(args);
    assert.equal(result.status, 2, result.stderr);
  });
}

test("invalid workspace produces a usage error rather than an implicit release", () => {
  const result = invoke([
    "npm",
    "plan",
    "fix",
    "--package",
    "@cloudigniter/core",
    "--json",
  ]);
  assert.equal(result.status, 2);
  assert.match(
    JSON.parse(result.stderr).error,
    /No CloudIgniter pnpm workspace/,
  );
});

test("status rejects unrelated planning options", async (t) => {
  const { root } = await fixture(t);
  const result = invoke(["npm", "status", "123", "--dry-run"], root);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /does not accept release-planning/);
});

test("npm operational failures retain exit code 1 independently of worker exit codes", async (t) => {
  const { root } = await fixture(t);
  const tools = path.join(root, "fake-tools");
  await mkdir(tools);
  await writeFile(
    path.join(tools, "gh"),
    `#!/usr/bin/env node\nif (process.argv[2] === "--version") console.log("gh version ${ciGithubCliRelease.version}"); else process.exit(23);\n`,
    { mode: 0o755 },
  );
  const result = spawnSync(
    process.execPath,
    [bin, "npm", "status", "123", "--json"],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${tools}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  assert.equal(result.status, 1, result.stderr);
  assert.match(JSON.parse(result.stderr).error, /23/);
});
