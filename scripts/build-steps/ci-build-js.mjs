#!/usr/bin/env node

import process from "node:process";
import { spawnSync } from "node:child_process";

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
 * Removes leading success icons from child output.
 *
 * @param {string} line - Output line.
 * @returns {string} Cleaned line.
 */
function ciStripLeadingSuccessIcon(line) {
  return line.trim().replace(/^✅\s*/, "");
}

/**
 * Extracts existing ci-output sections from output.
 *
 * @param {string} output - Captured output.
 * @returns {{ rawSections: string[]; remaining: string }} Parsed output.
 */
function ciExtractExistingOutputSections(output) {
  const sectionRegex =
    /::ci-output\s+(tree|block|plain)\n[\s\S]*?\n::ci-output-end/g;

  const rawSections = [];
  let remaining = output;

  const matches = output.match(sectionRegex) ?? [];

  for (const section of matches) {
    rawSections.push(section);
    remaining = remaining.replace(section, "");
  }

  return {
    rawSections,
    remaining,
  };
}

/**
 * Rewrites tsup output into CloudIgniter output sections.
 *
 * Existing ci-output sections are preserved as-is.
 *
 * @param {string} output - Captured stdout output.
 */
function ciEmitBuildOutput(output) {
  const { rawSections, remaining } = ciExtractExistingOutputSections(output);

  const lines = remaining.trimEnd().split("\n");

  const buildCompletedLines = [];
  const otherLines = [];

  for (const line of lines) {
    const cleanLine = ciStripLeadingSuccessIcon(line);

    if (/Build completed$/i.test(cleanLine)) {
      buildCompletedLines.push(cleanLine);
      continue;
    }

    if (cleanLine.trim() !== "") {
      otherLines.push(cleanLine);
    }
  }

  ciEmitOutputSection("tree", buildCompletedLines);
  ciEmitOutputSection("plain", otherLines);

  for (const section of rawSections) {
    console.log(section);
  }
}

/**
 * Builds JavaScript bundles using the package-local tsup configuration.
 */
function ciBuildJs() {
  const result = spawnSync(
    "pnpm",
    ["exec", "tsup", "--config", "tsup.config.ts"],
    {
      cwd: process.cwd(),
      shell: false,
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf8",
      env: {
        ...process.env,
        FORCE_COLOR: "1",
      },
    },
  );

  if (result.stdout?.trim()) {
    ciEmitBuildOutput(result.stdout);
  }

  if (result.stderr?.trim()) {
    console.error(result.stderr.trimEnd());
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

ciBuildJs();
