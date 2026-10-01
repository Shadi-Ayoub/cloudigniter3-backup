import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, access, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const worker = fileURLToPath(new URL("../workers/internal/ci-build-package.mjs", import.meta.url));

async function fixture(t, exitCode, gated = true) {
  const cwd = await mkdtemp(path.join(tmpdir(), "ci-build-gate-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  await mkdir(path.join(cwd, "scripts"));
  await mkdir(path.join(cwd, "dist"));
  await writeFile(path.join(cwd, "dist/previous-build"), "keep on failure");
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({
    name: "build-gate-fixture", private: true,
    scripts: { quality: `node -e "process.exit(${exitCode})"` },
  }));
  await writeFile(path.join(cwd, "scripts/ci-build-package.config.mjs"),
    `export default ${JSON.stringify({
      ...(gated ? { qualityScript: "quality" } : {}),
      steps: { dev: [{ file: "ci-clean.mjs", message: "clean" }], prod: [{ file: "ci-clean.mjs", message: "clean" }] },
    })}`);
  return cwd;
}

for (const mode of ["dev", "prod"]) {
  test(`${mode} build fails before cleaning when package quality fails`, async (t) => {
    const cwd = await fixture(t, 23);
    const result = spawnSync(process.execPath, [worker, mode], { cwd, encoding: "utf8" });
    assert.notEqual(result.status, 0, result.stdout + result.stderr);
    await access(path.join(cwd, "dist/previous-build"));
    assert.doesNotMatch(result.stdout, /build completed successfully/);
  });
  test(`${mode} build proceeds only after a passing quality gate`, async (t) => {
    const cwd = await fixture(t, 0);
    const result = spawnSync(process.execPath, [worker, mode], { cwd, encoding: "utf8" });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    await assert.rejects(access(path.join(cwd, "dist/previous-build")));
  });
}

test("packages outside the rollout retain their existing pipeline", async (t) => {
  const cwd = await fixture(t, 23, false);
  const result = spawnSync(process.execPath, [worker, "dev"], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
