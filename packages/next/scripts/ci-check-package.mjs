import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
import { ciValidateBuildImports } from "./ci-build-imports.mjs";
import { fileURLToPath } from "node:url";
import { ciValidatePackage } from "./ci-validate-package.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
if (manifest.main !== "./dist/index.js") throw new Error("Release packaging requires a production build in dist mode. Run pnpm release:check.");
const directory = path.join(root, "coverage/release");
mkdirSync(directory, { recursive: true });
const tarball = path.join(directory, `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`);
rmSync(tarball, { force: true });
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
run("pnpm", ["pack", "--pack-destination", directory]);
const files = run("tar", ["-tzf", tarball]).trim().split("\n").filter((file) => !file.endsWith("/")).map((file) => {
  if (!file.startsWith("package/")) throw new Error(`Unexpected archive path: ${file}`);
  return file.slice("package/".length);
});
const packed = JSON.parse(run("tar", ["-xOf", tarball, "package/package.json"]));
ciValidatePackage(packed, files);
for (const entry of ["dist/client/index.js", "dist/ui/client/index.js"]) {
  const code = run("tar", ["-xOf", tarball, `package/${entry}`]);
  if (!/^\s*["']use client["'];/.test(code)) throw new Error(`Missing client boundary: ${entry}`);
}
const extracted = mkdtempSync(path.join(tmpdir(), "ci-next-packed-"));
try {
  run("tar", ["-xzf", tarball, "-C", extracted]);
  ciValidateBuildImports(packed, new Map(files.map((file) => [file, file.endsWith(".js") ? readFileSync(path.join(extracted, "package", file), "utf8") : ""])));
} finally {
  rmSync(extracted, { recursive: true, force: true });
}
const sha256 = createHash("sha256").update(readFileSync(tarball)).digest("hex");
writeFileSync(path.join(directory, "package-check.json"), JSON.stringify({ name: packed.name, version: packed.version, tarball: path.basename(tarball), sha256, files: files.length }, null, 2) + "\n");
console.log(`Verified ${files.length} packed files: ${path.relative(root, tarball)}\nSHA-256: ${sha256}`);
