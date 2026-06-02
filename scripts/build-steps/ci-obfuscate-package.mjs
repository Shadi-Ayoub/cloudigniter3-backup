#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import fg from "fast-glob";
import JavaScriptObfuscator from "javascript-obfuscator";

const cwd = process.cwd();
const distDir = path.join(cwd, "dist");
const configPath = path.join(cwd, "obfuscator.config.json");

const shouldPrintFiles =
  process.env.CI_OBFUSCATE_VERBOSE === "1" ||
  process.env.CI_OBFUSCATE_VERBOSE === "true" ||
  process.env.CI_VERBOSE === "1" ||
  process.env.CI_VERBOSE === "true";

const defaultConfig = {
  compact: true,
  stringArray: true,
  stringArrayThreshold: 0.75,
  rotateStringArray: true,
  stringArrayEncoding: ["base64"],
  controlFlowFlattening: false,
  controlFlowFlatteningThreshold: 0,
};

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
 * Formats milliseconds for terminal display.
 *
 * @param {number} milliseconds - Duration in milliseconds.
 * @returns {string} Formatted duration.
 */
function ciFormatMs(milliseconds) {
  return `${Math.max(0, Math.round(milliseconds))} ms`;
}

/**
 * Loads package-local obfuscator configuration when available.
 *
 * @returns {Promise<Record<string, unknown>>} Obfuscator config.
 */
async function ciLoadConfig() {
  try {
    const raw = await fs.readFile(configPath, "utf8");

    return {
      ...defaultConfig,
      ...JSON.parse(raw),
    };
  } catch {
    return defaultConfig;
  }
}

/**
 * Checks whether a discovered file should be skipped.
 *
 * @param {string} filePath - Absolute file path.
 * @returns {boolean} Whether the file should be skipped.
 */
function ciShouldSkip(filePath) {
  const normalized = filePath.replace(/\\/g, "/");

  if (normalized.endsWith(".d.ts")) return true;
  if (normalized.endsWith(".map")) return true;
  if (normalized.endsWith(".json")) return true;
  if (normalized.endsWith(".css")) return true;

  return false;
}

/**
 * Obfuscates package runtime files under dist.
 */
async function ciObfuscatePackage() {
  const started = Date.now();

  try {
    await fs.access(distDir);
  } catch {
    console.error(`❌ Dist folder not found: ${path.relative(cwd, distDir)}`);
    process.exit(1);
  }

  const config = await ciLoadConfig();

  const files = await fg(["dist/**/*.{js,cjs,mjs}"], {
    cwd,
    absolute: true,
    onlyFiles: true,
  });

  const processedFiles = [];
  const skippedFiles = [];

  for (const file of files) {
    const relativeFile = path.relative(cwd, file);

    if (ciShouldSkip(file)) {
      skippedFiles.push(relativeFile);
      continue;
    }

    const source = await fs.readFile(file, "utf8");

    const result = JavaScriptObfuscator.obfuscate(source, {
      ...config,
      inputFileName: relativeFile,
    });

    await fs.writeFile(file, result.getObfuscatedCode(), "utf8");

    processedFiles.push(relativeFile);
  }

  const elapsed = Date.now() - started;

  ciEmitSummaryTable([
    {
      label: "Runtime files scanned",
      value: String(files.length),
    },
    {
      label: "Runtime files obfuscated",
      value: String(processedFiles.length),
    },
    {
      label: "Runtime files skipped",
      value: String(skippedFiles.length),
    },
    {
      label: "Config",
      value: path.relative(cwd, configPath),
    },
    {
      label: "Elapsed",
      value: ciFormatMs(elapsed),
    },
  ]);

  if (shouldPrintFiles && processedFiles.length > 0) {
    ciEmitOutputSection(
      "tree",
      processedFiles.map((file) => `Obfuscated: ${file}`),
    );
  }

  if (shouldPrintFiles && skippedFiles.length > 0) {
    ciEmitOutputSection(
      "tree",
      skippedFiles.map((file) => `⚠️ Skipped non-runtime file: ${file}`),
    );
  }
}

ciObfuscatePackage().catch((error) => {
  console.error("❌ Obfuscation failed.");
  console.error(error);
  process.exit(1);
});
