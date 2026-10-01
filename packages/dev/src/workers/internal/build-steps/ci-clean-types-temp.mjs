#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const tempTypesDir = path.join(cwd, "dist", ".types");

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
 * Removes temporary raw TypeScript declaration artifacts.
 */
async function ciCleanTypesTemp() {
  await fs.rm(tempTypesDir, {
    recursive: true,
    force: true,
  });

  ciEmitOutputSection("tree", [
    `Removed temporary declaration folder: ${path.relative(cwd, tempTypesDir)}`,
  ]);
}

ciCleanTypesTemp().catch((error) => {
  console.error("❌ Failed to remove temporary declaration artifacts.");
  console.error(error);
  process.exit(1);
});
