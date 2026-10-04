import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const directory = fileURLToPath(new URL("../../packages/config-ts/", import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8"));
for (const [entry, target] of Object.entries(manifest.exports)) {
  assert.equal(typeof target, "string", `${entry} must name a preset file`);
  assert(existsSync(path.join(directory, target)), `${entry} has no source file`);
  assert(manifest.files.includes(target.replace(/^\.\//, "")), `${entry} is absent from the package files list`);
  const config = ts.getParsedCommandLineOfConfigFile(path.join(directory, target), {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic(diagnostic) {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    },
  });
  assert(config, `${entry} could not be parsed`);
  // Presets are consumed by application/package projects; they have no sources of their own.
  const errors = config.errors.filter((diagnostic) => diagnostic.code !== 18003);
  assert.equal(errors.length, 0, `${entry}: ${errors.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n")).join("; ")}`);
}
console.log(`Validated ${Object.keys(manifest.exports).length} exported TypeScript presets and their package inventory.`);
