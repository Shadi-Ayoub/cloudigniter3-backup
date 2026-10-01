import fs from "node:fs";
import path from "node:path";

/**
 * Emits a marked output section for the shared build runner.
 *
 * @param {"tree" | "block" | "plain"} mode - Output rendering mode.
 * @param {string[]} lines - Output lines.
 */
function ciEmitOutputSection(mode, lines) {
  const cleanLines = lines.filter((line) => line.trim() !== "");

  if (cleanLines.length === 0) return;

  console.log(`::ci-output ${mode}`);
  console.log(cleanLines.join("\n"));
  console.log("::ci-output-end");
}

/**
 * Recursively collects JavaScript files from a directory.
 *
 * @param {string} dirPath - Directory path.
 * @returns {string[]} JavaScript file paths.
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
 * @param {string} content - File content.
 * @returns {boolean} Whether the file already has "use client".
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
 * @param {string} content - File content.
 * @returns {boolean} Whether the file is an empty chunk.
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
 * @param {string[]} targets - File or directory targets.
 * @returns {string[]} JavaScript file paths.
 */
function ciResolveJsTargets(targets) {
  const files = [];

  for (const target of targets) {
    const targetPath = path.resolve(target);

    if (!fs.existsSync(targetPath)) {
      ciEmitOutputSection("tree", [`Target not found: ${targetPath}`]);
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

    ciEmitOutputSection("tree", [`Skipped non-JS target: ${targetPath}`]);
  }

  return [...new Set(files)];
}

/**
 * Injects "use client" into compiled JavaScript files if not already present.
 *
 * @param {string[]} targets - File or directory targets.
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
  }

  ciEmitOutputSection("block", [
    "────────────────────────────────────────",
    "ciInjectUseClient Summary",
    "────────────────────────────────────────",
    `Files scanned:      ${files.length}`,
    `Injected:           ${injected}`,
    `Already client:     ${skippedUseClient}`,
    `Empty chunks:       ${skippedEmpty}`,
    "────────────────────────────────────────",
  ]);
}
