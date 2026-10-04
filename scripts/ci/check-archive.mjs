import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const directory = process.argv[2];
assert.ok(directory, "Provide the package archive directory.");
const archives = readdirSync(directory).filter((name) => name.endsWith(".tgz"));
assert.equal(archives.length, 1, "Expected exactly one packed candidate.");
const archive = join(directory, archives[0]);
const entries = new Set(execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).trim().split("\n"));
const manifest = JSON.parse(execFileSync("tar", ["-xOzf", archive, "package/package.json"], { encoding: "utf8" }));

function checkTarget(target) {
  assert.ok(target.startsWith("./"), `Unsupported archive export: ${target}`);
  const path = `package/${target.slice(2)}`;
  if (path.includes("*")) {
    const pattern = new RegExp(`^${path.split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".+")}$`);
    assert.ok([...entries].some((entry) => pattern.test(entry)), `Empty archive export: ${target}`);
  } else {
    assert.ok(entries.has(path), `Missing archive export: ${target}`);
  }
}
function checkExports(value) {
  if (typeof value === "string") checkTarget(value);
  else if (value && typeof value === "object") Object.values(value).forEach(checkExports);
}
checkExports(manifest.exports);
for (const field of ["main", "module", "types"]) if (manifest[field]) checkTarget(manifest[field]);
for (const target of Object.values(typeof manifest.bin === "string" ? { bin: manifest.bin } : manifest.bin ?? {})) checkTarget(target.startsWith("./") ? target : `./${target}`);
console.log(`Verified advertised archive entries for ${manifest.name}@${manifest.version}.`);
