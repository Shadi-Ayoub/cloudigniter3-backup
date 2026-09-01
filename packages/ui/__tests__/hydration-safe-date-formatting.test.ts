import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const clientRoot = resolve(packageRoot, "src/client");

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const pathname = resolve(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(pathname);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [pathname] : [];
  });
}

function lineNumber(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

test("client UI avoids host-default date formatting during SSR", () => {
  const forbiddenPatterns = [
    {
      pattern:
        /(?:new\s+)?Intl\.DateTimeFormat\s*\(\s*(?:undefined\s*(?:,|\))|\))/g,
      label: "Intl.DateTimeFormat without an explicit locale",
    },
    {
      pattern:
        /\.(?:toLocaleString|toLocaleDateString|toLocaleTimeString)\s*\(\s*(?:undefined\s*(?:,|\))|\))/g,
      label: "locale date formatting without an explicit locale",
    },
  ];
  const violations: string[] = [];

  for (const pathname of listTypeScriptFiles(clientRoot)) {
    const source = readFileSync(pathname, "utf8");
    for (const { pattern, label } of forbiddenPatterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) {
        violations.push(
          `${relative(packageRoot, pathname)}:${lineNumber(source, match.index)} — ${label}`,
        );
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    "SSR-visible client code must use a shared formatter with an explicit locale and time zone.",
  );
});
