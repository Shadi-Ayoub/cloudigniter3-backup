#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import fg from "fast-glob";

const cwd = process.cwd();
const sourceRoot = path.join(cwd, "src");
const declarationRoot = path.join(cwd, "dist", ".types");

const shouldPrintFiles =
  process.env.CI_TYPES_VERBOSE === "1" ||
  process.env.CI_TYPES_VERBOSE === "true";

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
 * Formats milliseconds for terminal display.
 *
 * @param {number} milliseconds - Duration in milliseconds.
 * @returns {string} Formatted duration.
 */
function ciFormatMs(milliseconds) {
  return `${Math.max(0, Math.round(milliseconds))} ms`;
}

/**
 * Converts a source path to the expected declaration output path.
 *
 * @param {string} sourceFile - Absolute source file path.
 * @returns {string} Absolute declaration file path.
 */
function ciMapSourceToDeclaration(sourceFile) {
  const relativeSource = path.relative(sourceRoot, sourceFile);
  const parsed = path.parse(relativeSource);

  return path.join(declarationRoot, parsed.dir, `${parsed.name}.d.ts`);
}

/**
 * Truncates long terminal values from the left while preserving useful endings.
 *
 * @param {string} value - Value to truncate.
 * @param {number} maxLength - Maximum visible length.
 * @returns {string} Truncated value.
 */
function ciTruncateLeft(value, maxLength) {
  if (value.length <= maxLength) return value;

  return `…${value.slice(-(maxLength - 1))}`;
}

// /**
//  * Prints a compact terminal table.
//  *
//  * @param {{ label: string; value: string }[]} rows - Table rows.
//  */
// function ciPrintSummaryTable(rows) {
//   const labelWidth = Math.max(...rows.map((row) => row.label.length));
//   const valueWidth = Math.max(...rows.map((row) => row.value.length));

//   const top = `┌${"─".repeat(labelWidth + 2)}┬${"─".repeat(valueWidth + 2)}┐`;
//   const bottom = `└${"─".repeat(labelWidth + 2)}┴${"─".repeat(
//     valueWidth + 2,
//   )}┘`;

//   console.log(top);

//   for (const row of rows) {
//     console.log(
//       `│ ${row.label.padEnd(labelWidth)} │ ${row.value.padEnd(valueWidth)} │`,
//     );
//   }

//   console.log(bottom);
// }

/**
 * Emits a summary table for the shared build runner.
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
 * Prints generated declaration files in verbose mode.
 *
 * @param {{ source: string; destination: string; created: string }[]} rows - File rows.
 */
function ciPrintVerboseFiles(rows) {
  const sourceWidth = 44;
  const destinationWidth = 54;
  const createdWidth = 9;

  const lines = [];

  lines.push("Generated declaration files:");

  lines.push(
    `┌${"─".repeat(sourceWidth + 2)}┬${"─".repeat(
      destinationWidth + 2,
    )}┬${"─".repeat(createdWidth + 2)}┐`,
  );

  lines.push(
    `│ ${"Source".padEnd(sourceWidth)} │ ${"Destination".padEnd(
      destinationWidth,
    )} │ ${"Created".padEnd(createdWidth)} │`,
  );

  lines.push(
    `├${"─".repeat(sourceWidth + 2)}┼${"─".repeat(
      destinationWidth + 2,
    )}┼${"─".repeat(createdWidth + 2)}┤`,
  );

  for (const row of rows) {
    lines.push(
      `│ ${ciTruncateLeft(row.source, sourceWidth).padEnd(
        sourceWidth,
      )} │ ${ciTruncateLeft(row.destination, destinationWidth).padEnd(
        destinationWidth,
      )} │ ${row.created.padEnd(createdWidth)} │`,
    );
  }

  lines.push(
    `└${"─".repeat(sourceWidth + 2)}┴${"─".repeat(
      destinationWidth + 2,
    )}┴${"─".repeat(createdWidth + 2)}┘`,
  );

  ciEmitOutputSection("block", lines);
}

/**
 * Generates raw TypeScript declaration files silently.
 */
async function ciBuildTypesRaw() {
  const started = Date.now();

  const result = spawnSync(
    "pnpm",
    ["exec", "tsc", "-p", "tsconfig.build.json"],
    {
      cwd,
      shell: false,
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf8",
      env: {
        ...process.env,
        FORCE_COLOR: "1",
      },
    },
  );

  if (result.status !== 0) {
    if (result.stdout?.trim()) console.log(result.stdout.trimEnd());
    if (result.stderr?.trim()) console.error(result.stderr.trimEnd());

    process.exit(result.status ?? 1);
  }

  const sourceFiles = await fg(["src/**/*.{ts,tsx}"], {
    cwd,
    absolute: true,
    onlyFiles: true,
    ignore: [
      "src/**/*.d.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
    ],
  });

  const rows = [];

  for (const sourceFile of sourceFiles) {
    const declarationFile = ciMapSourceToDeclaration(sourceFile);

    try {
      const stat = await fs.stat(declarationFile);

      rows.push({
        source: path.relative(cwd, sourceFile),
        destination: path.relative(cwd, declarationFile),
        created: ciFormatMs(stat.mtimeMs - started),
      });
    } catch {
      // Some source files may not emit declaration files directly.
    }
  }

  const elapsed = Date.now() - started;

  ciEmitSummaryTable([
    {
      label: "Source files scanned",
      value: String(sourceFiles.length),
    },
    {
      label: "Declarations generated",
      value: String(rows.length),
    },
    {
      label: "Output directory",
      value: path.relative(cwd, declarationRoot),
    },
    {
      label: "Elapsed",
      value: ciFormatMs(elapsed),
    },
  ]);

  if (shouldPrintFiles) {
    ciPrintVerboseFiles(rows);
  }
}

ciBuildTypesRaw().catch((error) => {
  console.error("Failed to generate raw TypeScript declarations.");
  console.error(error);
  process.exit(1);
});
