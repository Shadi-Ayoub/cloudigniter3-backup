import fs from "node:fs";
import path from "node:path";

/**
 * Recursively collects JavaScript files from a directory.
 *
 * @param {string} dirPath
 * @returns {string[]}
 */
function ciCollectJsFiles(dirPath) {
  const files = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...ciCollectJsFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files;
}

/**
 * Checks whether a compiled file already starts with "use client".
 *
 * @param {string} content
 * @returns {boolean}
 */
function ciHasUseClient(content) {
  const trimmed = content.trimStart();

  return (
    trimmed.startsWith('"use client";') ||
    trimmed.startsWith("'use client';") ||
    trimmed.startsWith('"use client"') ||
    trimmed.startsWith("'use client'")
  );
}

/**
 * Detects empty / type-only JS output.
 *
 * Common examples:
 *   export {};
 *   "use strict"; export {};
 *
 * @param {string} content
 * @returns {boolean}
 */
function ciIsEmptyChunk(content) {
  const normalized = content
    .replace(/["']use strict["'];?/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();

  return (
    normalized === "" ||
    normalized === "export {};" ||
    normalized === "export{};" ||
    normalized === ";"
  );
}

/**
 * Resolves file and directory targets into concrete JavaScript file paths.
 *
 * @param {string[]} targets
 * @returns {string[]}
 */
function ciResolveJsTargets(targets) {
  const files = [];

  for (const target of targets) {
    const targetPath = path.resolve(target);

    if (!fs.existsSync(targetPath)) {
      console.warn(`⚠️ Target not found: ${targetPath}`);
      continue;
    }

    const stat = fs.statSync(targetPath);

    if (stat.isDirectory()) {
      files.push(...ciCollectJsFiles(targetPath));
      continue;
    }

    if (stat.isFile() && targetPath.endsWith(".js")) {
      files.push(targetPath);
      continue;
    }

    console.warn(`⚠️ Skipped non-JS target: ${targetPath}`);
  }

  return [...new Set(files)];
}

/**
 * Injects "use client" into compiled JavaScript files if not already present.
 *
 * Targets may be explicit .js files or directories. When a directory is passed,
 * all .js files inside it and its subdirectories are processed.
 *
 * @param {string[]} targets
 */
export async function ciInjectUseClient(targets) {
  const files = ciResolveJsTargets(targets);

  let injected = 0;
  let skippedUseClient = 0;
  let skippedEmpty = 0;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");

    if (ciIsEmptyChunk(content)) {
      skippedEmpty++;
      continue;
    }

    if (ciHasUseClient(content)) {
      skippedUseClient++;
      continue;
    }

    fs.writeFileSync(filePath, `"use client";\n${content}`, "utf8");

    injected++;

    // console.log(`⚡️ Successfully injected "use client" into ${filePath}`);
  }

  console.log("");
  console.log("────────────────────────────────────────");
  console.log("ciInjectUseClient Summary");
  console.log("────────────────────────────────────────");
  console.log(`Files scanned:      ${files.length}`);
  console.log(`Injected:           ${injected}`);
  console.log(`Already client:     ${skippedUseClient}`);
  console.log(`Empty chunks:       ${skippedEmpty}`);
  console.log("────────────────────────────────────────");
}
