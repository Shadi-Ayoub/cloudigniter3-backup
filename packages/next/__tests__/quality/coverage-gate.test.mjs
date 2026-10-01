import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, copyFile, rm, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
const source = "export const example = true;";
const hash = createHash("sha256").update(source).digest("hex");
const minimum = { lines: 90, statements: 90, functions: 90, branches: 80 };
async function run(t, { score = 100, legacy, content = source, empty = false } = {}) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "ci-coverage-gate-")));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const folder of ["scripts", "src", "coverage"]) await mkdir(path.join(root, folder));
  await copyFile(new URL("../../scripts/ci-check-coverage.mjs", import.meta.url), path.join(root, "scripts/ci-check-coverage.mjs"));
  await writeFile(path.join(root, "src/example.ts"), content);
  await writeFile(path.join(root, "coverage-policy.json"), JSON.stringify({ minimum, legacy: legacy ? { "src/example.ts": legacy } : {} }));
  await writeFile(path.join(root, "coverage/coverage-summary.json"), JSON.stringify(empty ? {} : {
    [path.join(root, "src/example.ts")]: Object.fromEntries(Object.keys(minimum).map((key) => [key, { pct: score }])),
  }));
  return spawnSync(process.execPath, ["scripts/ci-check-coverage.mjs"], { cwd: root, encoding: "utf8" });
}
test("high coverage allows new code", async (t) => assert.equal((await run(t)).status, 0));
test("untested new production code blocks the build", async (t) => assert.notEqual((await run(t, { score: 0 })).status, 0));
test("a frozen legacy exception permits only its recorded floor", async (t) => {
  const legacy = { sha256: hash, minimum: { lines: 40, statements: 40, functions: 40, branches: 40 } };
  assert.equal((await run(t, { score: 40, legacy })).status, 0);
  assert.notEqual((await run(t, { score: 39, legacy })).status, 0);
});
test("editing a legacy file activates the strict new-code thresholds", async (t) => {
  const legacy = { sha256: hash, minimum: { lines: 0, statements: 0, functions: 0, branches: 0 } };
  assert.notEqual((await run(t, { score: 20, legacy, content: source + "\nexport const added = true;" })).status, 0);
});
test("missing coverage cannot silently pass", async (t) => assert.notEqual((await run(t, { empty: true })).status, 0));
