#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const rollupConfigPath = path.join(cwd, "rollup.config.js");

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

/**
 * Imports the package-local Rollup config.
 *
 * @returns {Promise<import("rollup").RollupOptions[]>} Rollup config entries.
 */
async function ciLoadRollupConfig() {
  const configUrl = pathToFileURL(rollupConfigPath);
  configUrl.searchParams.set("ci-cache-bust", String(Date.now()));

  const configModule = await import(configUrl.href);
  const config = configModule.default;

  if (!Array.isArray(config)) {
    throw new Error("rollup.config.js must export an array of Rollup options.");
  }

  return config;
}

/**
 * Extracts declaration bundle input/output pairs from Rollup config.
 *
 * @param {import("rollup").RollupOptions[]} config - Rollup config entries.
 * @returns {{ input: string; output: string }[]} Declaration bundle entries.
 */
function ciGetDeclarationBundleEntries(config) {
  return config
    .map((entry) => {
      const input = typeof entry.input === "string" ? entry.input : null;

      const outputConfig = Array.isArray(entry.output)
        ? entry.output[0]
        : entry.output;

      const output =
        outputConfig && typeof outputConfig.file === "string"
          ? outputConfig.file
          : null;

      if (!input || !output) return null;

      return {
        input,
        output,
      };
    })
    .filter(Boolean);
}

/**
 * Prints a compact summary table.
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
 * Emits generated declaration bundle entries as a compact table.
 *
 * @param {{ input: string; output: string; created: string }[]} rows - Bundle rows.
 */
function ciEmitBundleTable(rows) {
  const inputWidth = 42;
  const outputWidth = 42;
  const createdWidth = 9;

  const lines = [];

  lines.push("Bundled declaration entries:");

  lines.push(
    `┌${"─".repeat(inputWidth + 2)}┬${"─".repeat(outputWidth + 2)}┬${"─".repeat(
      createdWidth + 2,
    )}┐`,
  );

  lines.push(
    `│ ${"Input".padEnd(inputWidth)} │ ${"Output".padEnd(
      outputWidth,
    )} │ ${"Created".padEnd(createdWidth)} │`,
  );

  lines.push(
    `├${"─".repeat(inputWidth + 2)}┼${"─".repeat(outputWidth + 2)}┼${"─".repeat(
      createdWidth + 2,
    )}┤`,
  );

  for (const row of rows) {
    lines.push(
      `│ ${ciTruncateLeft(row.input, inputWidth).padEnd(
        inputWidth,
      )} │ ${ciTruncateLeft(row.output, outputWidth).padEnd(
        outputWidth,
      )} │ ${row.created.padEnd(createdWidth)} │`,
    );
  }

  lines.push(
    `└${"─".repeat(inputWidth + 2)}┴${"─".repeat(outputWidth + 2)}┴${"─".repeat(
      createdWidth + 2,
    )}┘`,
  );

  ciEmitOutputSection("block", lines);
}

/**
 * Bundles generated declaration files using Rollup.
 */
async function ciBuildTypes() {
  const started = Date.now();
  const config = await ciLoadRollupConfig();
  const entries = ciGetDeclarationBundleEntries(config);

  const result = spawnSync(
    "pnpm",
    ["exec", "rollup", "-c", "rollup.config.js"],
    {
      cwd,
      shell: false,
      stdio: ["inherit", "pipe", "pipe"],
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_OPTIONS: [process.env.NODE_OPTIONS, "--max-old-space-size=12288"]
          .filter(Boolean)
          .join(" "),
        FORCE_COLOR: "1",
      },
    },
  );

  if (result.status !== 0) {
    if (result.stdout?.trim()) console.log(result.stdout.trimEnd());
    if (result.stderr?.trim()) console.error(result.stderr.trimEnd());

    process.exit(result.status ?? 1);
  }

  const rows = [];

  for (const entry of entries) {
    try {
      const stat = await fs.stat(path.join(cwd, entry.output));

      rows.push({
        input: entry.input,
        output: entry.output,
        created: ciFormatMs(stat.mtimeMs - started),
      });
    } catch {
      rows.push({
        input: entry.input,
        output: entry.output,
        created: "missing",
      });
    }
  }

  const elapsed = Date.now() - started;
  const missingCount = rows.filter((row) => row.created === "missing").length;

  ciEmitSummaryTable([
    {
      label: "Rollup entries",
      value: String(entries.length),
    },
    {
      label: "Declarations bundled",
      value: String(rows.length - missingCount),
    },
    {
      label: "Missing outputs",
      value: String(missingCount),
    },
    {
      label: "Elapsed",
      value: ciFormatMs(elapsed),
    },
  ]);

  ciEmitBundleTable(rows);
}

ciBuildTypes().catch((error) => {
  console.error("Failed to bundle declaration files.");
  console.error(error);
  process.exit(1);
});
