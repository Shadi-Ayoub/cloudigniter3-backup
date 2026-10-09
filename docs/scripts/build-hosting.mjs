import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdtemp, mkdir, rm, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ciCreateDocsManifest,
  ciVerifyDocsSite,
} from "../../packages/dev/src/ci/docs-site.mjs";

const siteDir = fileURLToPath(new URL("../", import.meta.url));
const workspace = path.dirname(siteDir);
const output = path.join(siteDir, "build/hosting");
const temporary = await mkdtemp(
  path.join(tmpdir(), "cloudigniter-docs-hosting-"),
);
const cli = fileURLToPath(
  new URL(
    "../node_modules/@docusaurus/core/bin/docusaurus.mjs",
    import.meta.url,
  ),
);
function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Docs build failed: ${command} (${result.status}).`);
}
function git(args) {
  const result = spawnSync("git", args, { cwd: workspace, encoding: "utf8" });
  if (result.status !== 0)
    throw new Error("Docs build needs a Git integration workspace.");
  return result.stdout.trim();
}
try {
  // Keep partial editions outside deployable output. A failed build must never
  // leave a stale manifest that looks like the newly requested release.
  await rm(output, { recursive: true, force: true });
  for (const edition of ["public", "developer"]) {
    const env = { ...process.env, DOCS_EDITION: edition };
    run(process.execPath, [cli, "clear"], siteDir, env);
    run(
      process.execPath,
      [cli, "build", "--out-dir", path.join(temporary, edition)],
      siteDir,
      env,
    );
  }
  const policy = JSON.parse(
    await readFile(path.join(siteDir, "hosting-policy.json"), "utf8"),
  );
  const manifest = await ciCreateDocsManifest(temporary, {
    sourceCommit: git(["rev-parse", "HEAD"]),
    sourceDirty:
      git(["status", "--porcelain", "--untracked-files=normal"]) !== "",
    policy,
  });
  await writeFile(
    path.join(temporary, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  await ciVerifyDocsSite(temporary, false);
  await mkdir(path.dirname(output), { recursive: true });
  await cp(temporary, output, { recursive: true });
  console.log(
    `Static Docs prepared at ${output}. Developer delivery requires CloudIgniter/EmberGuard authorization.`,
  );
  if (manifest.sourceDirty)
    console.log(
      "Local diagnostic build: commit and rebuild before production delivery.",
    );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
