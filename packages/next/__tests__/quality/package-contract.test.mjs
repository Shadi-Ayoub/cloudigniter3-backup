import assert from "node:assert/strict";
import test from "node:test";
import { ciValidatePackage } from "../../scripts/ci-validate-package.mjs";
const manifest = {
  name: "@cloudigniter/next", version: "0.0.1", files: ["dist"],
  main: "./dist/index.js", module: "./dist/index.js", types: "./dist/types/index.d.ts",
  exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" }, "./types": { types: "./dist/types/index.d.ts", import: "./dist/types/index.d.ts" } },
};
const files = ["package.json", "dist/index.js", "dist/index.d.ts", "dist/types/index.d.ts"];
test("a complete distribution satisfies the package contract", () => assert.doesNotThrow(() => ciValidatePackage(manifest, files)));
test("source-mode manifests cannot be published", () => assert.throws(() => ciValidatePackage({ ...manifest, main: "./src/index.ts" }, files), /dist/));
test("missing runtime and declaration exports fail validation", () => {
  for (const missing of files.slice(1)) assert.throws(() => ciValidatePackage(manifest, files.filter((file) => file !== missing)), /missing/i);
});
test("tests, credentials, source files and build intermediates cannot enter the tarball", () => {
  for (const file of ["src/secret.ts", ".env", "dist/.types/raw.d.ts", "dist/example.test.js", "dist/._index.js", "dist/index.js.map"]) {
    assert.throws(() => ciValidatePackage(manifest, [...files, file]), /unexpected/i);
  }
});
test("published dependencies cannot retain workspace references", () => assert.throws(() => ciValidatePackage({ ...manifest, dependencies: { "@cloudigniter/core": "workspace:*" } }, files), /workspace/));
