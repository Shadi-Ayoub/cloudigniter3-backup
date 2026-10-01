import ts from "typescript";
import path from "node:path";
import { builtinModules } from "node:module";
import { readFile, writeFile, readdir } from "node:fs/promises";

function imports(source) {
  const file = ts.createSourceFile("entry.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  return file.statements.flatMap((statement) => {
    const specifier = (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier;
    return specifier && ts.isStringLiteral(specifier) ? [{ value: specifier.text, start: specifier.getStart(file), end: specifier.end }] : [];
  });
}
export function ciRewriteBuildImports(source, manifest) {
  for (const item of imports(source).reverse()) {
    if (!item.value.startsWith("@ci-")) continue;
    const value = item.value.replace(/^@ci-(next|core|aws|ui)(?=\/|$)/, "@cloudigniter/$1");
    if (value.startsWith("@ci-")) throw new Error(`Unknown workspace alias: ${item.value}`);
    if (value.startsWith(manifest.name + "/") && !manifest.exports["." + value.slice(manifest.name.length)]) throw new Error(`Alias has no public export: ${item.value}`);
    source = source.slice(0, item.start) + JSON.stringify(value) + source.slice(item.end);
  }
  return source;
}
export async function ciRewriteRscImports(directories) {
  const manifest = JSON.parse(await readFile("package.json", "utf8"));
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.startsWith("._")) {
        const before = await readFile(file, "utf8");
        const after = ciRewriteBuildImports(before, manifest);
        if (before !== after) await writeFile(file, after);
      }
    }
  }
  for (const directory of directories) await visit(directory);
}
export function ciValidateBuildImports(manifest, sources) {
  const dependencies = { ...manifest.dependencies, ...manifest.peerDependencies, ...manifest.optionalDependencies };
  for (const [file, source] of sources) {
    for (const { value } of imports(source)) {
      if (value.startsWith(".")) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), value));
        if (![resolved, `${resolved}.js`, `${resolved}/index.js`].some((candidate) => sources.has(candidate))) throw new Error(`Missing relative import in ${file}: ${value}`);
      } else if (value.startsWith("node:") || builtinModules.includes(value)) continue;
      else {
        if (value.startsWith("@ci-")) throw new Error(`Unresolved workspace alias in ${file}: ${value}`);
        const name = value.startsWith("@") ? value.split("/").slice(0, 2).join("/") : value.split("/")[0];
        if (name === manifest.name) {
          const entry = value === name ? "." : "." + value.slice(name.length);
          if (!manifest.exports[entry]) throw new Error(`Missing self export in ${file}: ${value}`);
        } else if (!dependencies[name]) throw new Error(`Undeclared runtime dependency in ${file}: ${value}`);
      }
    }
  }
}
