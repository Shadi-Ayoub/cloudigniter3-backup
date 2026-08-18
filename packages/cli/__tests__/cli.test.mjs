import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { execaNode } from "execa";

import { ciImportPackageEntry } from "../src/runtime/ci-import-package-entry.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");

test("package publishes only the ci and ci-dev executable names", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, "package.json"), "utf8"),
  );

  assert.deepEqual(manifest.bin, {
    ci: "./bin/ci.mjs",
    "ci-dev": "./bin/ci-dev.mjs",
  });
});

test("public help exposes application commands only", async () => {
  const result = await execaNode(path.join(packageRoot, "bin/ci.mjs"), [
    "--help",
  ]);

  assert.match(result.stdout, /modules validate/);
  assert.match(result.stdout, /resources studio/);
  assert.match(result.stdout, /amplify sandbox bootstrap/);
  assert.match(result.stdout, /amplify sandbox deploy/);
  assert.doesNotMatch(result.stdout, /package obfuscate/);
});

test("developer help never exposes Resource Studio", async () => {
  const result = await execaNode(path.join(packageRoot, "bin/ci-dev.mjs"), [
    "--help",
  ]);

  assert.doesNotMatch(result.stdout, /resources studio/i);
  assert.doesNotMatch(result.stdout, /amplify sandbox deploy/i);
});

test("headless sandbox deploy requires an explicit profile", async () => {
  const result = await execaNode(
    path.join(packageRoot, "bin/ci.mjs"),
    ["amplify", "sandbox", "deploy", "--no-interactive"],
    { reject: false },
  );

  assert.equal(result.exitCode, 2);
  assert.match(result.stderr, /requires an explicit AWS profile/);
});

test("headless sandbox deploy requires an explicit identifier", async () => {
  const result = await execaNode(
    path.join(packageRoot, "bin/ci.mjs"),
    [
      "amplify",
      "sandbox",
      "deploy",
      "--profile=developer-sso",
      "--no-interactive",
    ],
    { reject: false },
  );

  assert.equal(result.exitCode, 2);
  assert.match(result.stderr, /requires an explicit identifier/);
});

test("developer commands reject non-CloudIgniter workspaces", async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "ci-cli-boundary-"),
  );
  await writeFile(
    path.join(temporaryDirectory, "package.json"),
    `${JSON.stringify({ name: "consumer", private: true })}\n`,
  );

  const result = await execaNode(
    path.join(packageRoot, "bin/ci-dev.mjs"),
    ["package", "build", "--mode=dev"],
    { cwd: temporaryDirectory, reject: false },
  );

  assert.equal(result.exitCode, 2);
  assert.match(
    result.stderr,
    /only available inside the private CloudIgniter monorepo/,
  );
});

test("package entries resolve from the target application's node_modules", async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "ci-cli-resolve-"),
  );
  const packageDirectory = path.join(
    temporaryDirectory,
    "node_modules/@example/provider",
  );
  await mkdir(packageDirectory, { recursive: true });
  await writeFile(
    path.join(packageDirectory, "package.json"),
    `${JSON.stringify({
      name: "@example/provider",
      type: "module",
      exports: { "./tool": { import: "./tool.mjs" } },
    })}\n`,
  );
  await writeFile(
    path.join(packageDirectory, "tool.mjs"),
    "export const value = 42;\n",
  );

  const resolved = await ciImportPackageEntry({
    baseDirectory: temporaryDirectory,
    packageName: "@example/provider",
    subpath: "tool",
  });

  assert.equal(resolved.value, 42);
  assert.match(pathToFileURL(packageDirectory).href, /^file:/);
});
