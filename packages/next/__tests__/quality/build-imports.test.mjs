import assert from "node:assert/strict";
import test from "node:test";
import { ciRewriteBuildImports, ciValidateBuildImports } from "../../scripts/ci-build-imports.mjs";
const manifest = { name: "@cloudigniter/next", exports: { "./server": {}, "./ui/client": {} }, dependencies: { "@cloudigniter/core": "0.0.1" }, peerDependencies: { react: "^19" } };
test("built imports use public package names without changing ordinary strings", () => {
  const source = `import {value} from "@ci-next/server"; export {Button} from '@ci-next/ui/client'; const label = "@ci-next/server";`;
  const output = ciRewriteBuildImports(source, manifest);
  assert.match(output, /from "@cloudigniter\/next\/server"/);
  assert.match(output, /from "@cloudigniter\/next\/ui\/client"/);
  assert.match(output, /const label = "@ci-next\/server"/);
});
test("unexported self aliases cannot become accidental public imports", () => assert.throws(() => ciRewriteBuildImports('import x from "@ci-next/private";', manifest), /export/));
test("archive import checks reject workspace aliases and undeclared dependencies", () => {
  for (const target of ["@ci-next/server", "missing-package"]) assert.throws(() => ciValidateBuildImports(manifest, new Map([["dist/index.js", `import x from "${target}";`]])), /dependency|alias/);
});
test("archive import checks reject missing relative modules", () => assert.throws(() => ciValidateBuildImports(manifest, new Map([["dist/index.js", 'export * from "./missing.js";']])), /relative/));
test("declared peers, dependencies, builtins and packed relative modules are valid", () => assert.doesNotThrow(() => ciValidateBuildImports(manifest, new Map([
  ["dist/index.js", 'import x from "react"; import y from "@cloudigniter/core/lib"; import fs from "node:fs"; export * from "./other";'],
  ["dist/other.js", 'export {};'],
]))));
