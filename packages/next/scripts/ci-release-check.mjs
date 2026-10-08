import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const files = ["package.json", "tsconfig.json", "../../apps/templates/cloudigniter-next-aws-v1/tsconfig.json", "../../apps/templates/cloudigniter-next-aws-v1/src/app/globals.css"];
const before = new Map(files.map((file) => [path.resolve(root, file), readFileSync(path.resolve(root, file))]));
const requestPath = path.join(root, "coverage/release/publish-request.md");
rmSync(requestPath, { force: true });
function run(script) {
  const result = spawnSync("pnpm", ["run", script], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Release check stopped at ${script}; no publish request is ready.`);
}
const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
const dirty = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
try {
  run("build:prod");
  run("check:package");
  const packed = JSON.parse(readFileSync(path.join(root, "coverage/release/package-check.json"), "utf8"));
  writeFileSync(requestPath, `# Publish request: ${packed.name}@${packed.version}\n\nStatus: awaiting maintainer review; nothing has been published.\n\n- Commit: ${revision.status === 0 ? revision.stdout.trim() : "unavailable"}\n- Working tree before validation: ${dirty.status === 0 && !dirty.stdout.trim() ? "clean" : "modified; validate the committed revision in CI before publishing"}\n- Artifact: ${packed.tarball}\n- SHA-256: ${packed.sha256}\n- Gates: tests, coverage policy, package/tool/test typechecks, production build, packed exports/assets and client directives.\n\nReview the version, Changeset, CI run, coverage report, dependency releases and compatibility notes. Approval applies only to this artifact and checksum; rerun validation after changes. Publish this exact tarball only after approval.\n`);
  console.log(`Publish request ready for review: ${requestPath}`);
} finally {
  // Production build switches workspace exports and template aliases. Restore
  // their exact original bytes even when a later build/pack step fails.
  for (const [file, content] of before) writeFileSync(file, content);
}
