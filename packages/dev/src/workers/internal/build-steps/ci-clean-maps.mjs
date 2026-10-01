#!/usr/bin/env node

import fs from "node:fs/promises";
import process from "node:process";
import fg from "fast-glob";

// CI_VERBOSE=1 pnpm build:prod

const cwd = process.cwd();

const shouldPrintFiles =
  process.env.CI_VERBOSE === "1" || process.env.CI_VERBOSE === "true";

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
 * Emits a compact summary table.
 *
 * @param {{ label: string; value: string }[]} rows - Summary rows.
 */
function ciEmitSummaryTable(rows) {
  const labelWidth = Math.max(...rows.map((row) => row.label.length));
  const valueWidth = Math.max(...rows.map((row) => row.value.length));

  const lines = [];

  lines.push(`┌${"─".repeat(labelWidth + 2)}┬${"─".repeat(valueWidth + 2)}┐`);

  for (const row of rows) {
    lines.push(
      `│ ${row.label.padEnd(labelWidth)} │ ${row.value.padEnd(valueWidth)} │`,
    );
  }

  lines.push(`└${"─".repeat(labelWidth + 2)}┴${"─".repeat(valueWidth + 2)}┘`);

  ciEmitOutputSection("block", lines);
}

/**
 * Removes generated source-map files from dist.
 */
async function ciCleanMaps() {
  const files = await fg(["dist/**/*.map"], {
    cwd,
    absolute: true,
    onlyFiles: true,
  });

  for (const file of files) {
    await fs.rm(file, {
      force: true,
    });
  }

  ciEmitSummaryTable([
    {
      label: "Source maps removed",
      value: String(files.length),
    },
  ]);

  if (shouldPrintFiles && files.length > 0) {
    ciEmitOutputSection(
      "tree",
      files.map((file) => `Removed: ${file.replace(`${cwd}/`, "")}`),
    );
  }
}

ciCleanMaps().catch((error) => {
  console.error(error);
  process.exit(1);
});
