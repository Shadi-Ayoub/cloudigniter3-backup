#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import ora from "ora";

const ciScriptDir = path.dirname(fileURLToPath(import.meta.url));
const ciBuildStepsDir = path.join(ciScriptDir, "build-steps");

const ciColors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",

  blue: "\x1b[38;5;39m",
  green: "\x1b[38;5;42m",
  red: "\x1b[38;5;196m",
  cyan: "\x1b[38;5;51m",
};

function ciColor(text, ...styles) {
  return `${styles.join("")}${text}${ciColors.reset}`;
}

/**
 * Formats tree-style child output.
 *
 * Default icon:
 *   📦
 *
 * Special cases:
 *   ⚠️ warning lines
 *   ❌ error lines
 *
 * @param {string} output - Output text.
 * @returns {string} Formatted output.
 */
function ciFormatTreeOutput(output) {
  return output
    .trimEnd()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const trimmed = line.trim();

      let icon = "📦";

      if (trimmed.startsWith("⚠️")) {
        icon = "⚠️";
        line = trimmed.replace(/^⚠️\s*/, "");
      } else if (trimmed.startsWith("❌")) {
        icon = "❌";
        line = trimmed.replace(/^❌\s*/, "");
      }

      return `   └─ ${icon} ${line}`;
    })
    .join("\n");
}

function ciFormatBlockOutput(output) {
  return output
    .trimEnd()
    .split("\n")
    .map((line) => `   ${line}`)
    .join("\n");
}

function ciFormatPlainOutput(output) {
  return output
    .trimEnd()
    .split("\n")
    .map((line) => `   ${line}`)
    .join("\n");
}

function ciFormatChildOutputSection(mode, content) {
  switch (mode) {
    case "tree":
      return ciFormatTreeOutput(content);

    case "block":
      return ciFormatBlockOutput(content);

    case "plain":
    default:
      return ciFormatPlainOutput(content);
  }
}

function ciParseChildOutput(output, fallbackMode = "tree") {
  const text = output.trimEnd();

  if (!text) {
    return [];
  }

  const sectionRegex =
    /::ci-output\s+(tree|block|plain)\n([\s\S]*?)\n::ci-output-end/g;

  const sections = [];
  let lastIndex = 0;
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();

    if (before) {
      sections.push({
        mode: fallbackMode,
        content: before,
      });
    }

    sections.push({
      mode: match[1],
      content: match[2],
    });

    lastIndex = sectionRegex.lastIndex;
  }

  const remaining = text.slice(lastIndex).trim();

  if (remaining) {
    sections.push({
      mode: fallbackMode,
      content: remaining,
    });
  }

  return sections;
}

/**
 * Fully stops and clears an Ora spinner.
 *
 * @param {import("ora").Ora | null | undefined} spinner - Ora spinner instance.
 */
function ciDestroySpinner(spinner) {
  if (!spinner) return;

  if (spinner.isSpinning) {
    spinner.stop();
  }

  spinner.clear();
}

/**
 * Formats a Date object as HH:mm:ss.
 *
 * @param {Date} date - Date instance to format.
 * @returns {string} Formatted time.
 */
function ciFormatTime(date) {
  if (!(date instanceof Date)) {
    return "-";
  }

  return date.toLocaleTimeString("en-GB", {
    hour12: false,
  });
}

/**
 * Formats elapsed milliseconds as HHh MMm SSs.
 *
 * @param {number} milliseconds - Elapsed milliseconds.
 * @returns {string} Formatted duration.
 */
function ciFormatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(
    2,
    "0",
  )}m ${String(seconds).padStart(2, "0")}s`;
}

/**
 * Reads the current package name from package.json.
 *
 * @returns {string} Package name.
 */
function ciGetPackageName() {
  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    return packageJson.name ?? "package";
  } catch {
    return "package";
  }
}

/**
 * Loads the package-local build config.
 *
 * @returns {Promise<{
 *   steps: {
 *     dev: string[];
 *     prod: string[];
 *   };
 *   messages: Record<string, string>;
 * }>}
 */
async function ciLoadBuildConfig() {
  const configPath = path.join(
    process.cwd(),
    "scripts",
    "ci-build-package.config.mjs",
  );

  if (!fs.existsSync(configPath)) {
    console.error(`Missing build config file: ${configPath}`);
    process.exit(1);
  }

  const configModule = await import(pathToFileURL(configPath).href);
  const config = configModule.default ?? configModule.ciBuildPackageConfig;

  if (!config?.steps?.dev || !config?.steps?.prod) {
    console.error("Invalid build config. Expected steps.dev and steps.prod.");
    process.exit(1);
  }

  return config;
}

/**
 * Prints a simple terminal summary table.
 *
 * @param {{ label: string; value: string }[]} rows - Rows to print.
 */
// function ciPrintSummaryTable(rows) {
//   const labelWidth = Math.max(...rows.map((row) => row.label.length));
//   const valueWidth = Math.max(...rows.map((row) => row.value.length));

//   const top = `┌${"─".repeat(labelWidth + 2)}┬${"─".repeat(valueWidth + 2)}┐`;
//   const separator = `├${"─".repeat(labelWidth + 2)}┼${"─".repeat(
//     valueWidth + 2,
//   )}┤`;
//   const bottom = `└${"─".repeat(labelWidth + 2)}┴${"─".repeat(
//     valueWidth + 2,
//   )}┘`;

//   console.log(top);

//   rows.forEach((row, index) => {
//     console.log(
//       `│ ${row.label.padEnd(labelWidth, " ")} │ ${row.value.padEnd(
//         valueWidth,
//         " ",
//       )} │`,
//     );

//     if (index === 1) {
//       console.log(separator);
//     }
//   });

//   console.log(bottom);
// }

/**
 * Flushes buffered child-process output after a step completes.
 *
 * @param {object} input - Flush input.
 * @param {string} input.stdout - Captured stdout.
 * @param {string} input.stderr - Captured stderr.
 * update JSDoc!!!
 */
function ciFlushOutput({ stdout, stderr, mode = "tree" }) {
  const stdoutSections = ciParseChildOutput(stdout, mode);
  const stderrSections = ciParseChildOutput(stderr, mode);

  for (const section of stdoutSections) {
    console.log("");
    console.log(ciFormatChildOutputSection(section.mode, section.content));
  }

  for (const section of stderrSections) {
    console.error("");
    console.error(ciFormatChildOutputSection(section.mode, section.content));
  }
}

/**
 * Prints the final build summary table.
 *
 * @param {object} input - Summary input.
 * @param {Date} input.buildFinished - Build completion time.
 * @param {number} input.duration - Total build duration.
 * @param {Array<{
 *   stepNumber: number;
 *   description: string;
 *   startedAt: Date;
 *   duration: number;
 *   status: "success" | "failed";
 * }>} input.stepResults - Step results.
 */
function ciPrintSummaryTable({
  buildStarted,
  buildFinished,
  duration,
  stepResults,
}) {
  const rows = [
    {
      step: "TOTAL",
      started: ciFormatTime(buildStarted),
      duration: ciFormatDuration(duration),
      description: `Finished at ${ciFormatTime(buildFinished)}`,
    },
    ...stepResults.map((result) => ({
      step: `STEP${result.stepNumber}`,
      started: ciFormatTime(result.startedAt),
      duration: ciFormatDuration(result.duration ?? 0),
      description: result.description ?? "-",
    })),
  ];

  const stepWidth = Math.max(
    "Step".length,
    ...rows.map((row) => String(row.step ?? "").length),
  );

  const startedWidth = Math.max(
    "Started".length,
    ...rows.map((row) => String(row.started ?? "").length),
  );

  const durationWidth = Math.max(
    "Duration".length,
    ...rows.map((row) => String(row.duration ?? "").length),
  );

  const descriptionWidth = Math.max(
    "Description".length,
    ...rows.map((row) => String(row.description ?? "").length),
  );

  const top =
    `┌${"─".repeat(stepWidth + 2)}` +
    `┬${"─".repeat(startedWidth + 2)}` +
    `┬${"─".repeat(durationWidth + 2)}` +
    `┬${"─".repeat(descriptionWidth + 2)}┐`;

  const separator =
    `├${"─".repeat(stepWidth + 2)}` +
    `┼${"─".repeat(startedWidth + 2)}` +
    `┼${"─".repeat(durationWidth + 2)}` +
    `┼${"─".repeat(descriptionWidth + 2)}┤`;

  const bottom =
    `└${"─".repeat(stepWidth + 2)}` +
    `┴${"─".repeat(startedWidth + 2)}` +
    `┴${"─".repeat(durationWidth + 2)}` +
    `┴${"─".repeat(descriptionWidth + 2)}┘`;

  console.log(top);

  console.log(
    `│ ${"Step".padEnd(stepWidth)} ` +
      `│ ${"Started".padEnd(startedWidth)} ` +
      `│ ${"Duration".padEnd(durationWidth)} ` +
      `│ ${"Description".padEnd(descriptionWidth)} │`,
  );

  console.log(separator);

  for (const row of rows) {
    console.log(
      `│ ${row.step.padEnd(stepWidth)} ` +
        `│ ${row.started.padEnd(startedWidth)} ` +
        `│ ${row.duration.padEnd(durationWidth)} ` +
        `│ ${row.description.padEnd(descriptionWidth)} │`,
    );
  }

  console.log(bottom);
}

/**
 * Runs one package script.
 *
 * Child process output is captured while ora displays a stable spinner.
 * Captured output is flushed only after the step finishes.
 *
 * @param {object} input - Step input.
 * @param {string} input.scriptName - package.json script name.
 * @param {number} input.stepNumber - Step number.
 * @param {string} input.message - User-friendly step message.
 * @param {Record<string, string>} input.extraEnv - Extra environment variables.
 * @returns {Promise<void>}
 */
function ciRunScript({ step, stepNumber, extraEnv, stepResults }) {
  return new Promise((resolve) => {
    const stepLabel = `STEP${stepNumber}`;
    const started = Date.now();
    const startedAt = new Date();

    const stepPath = path.join(ciBuildStepsDir, step.file);

    let stdout = "";
    let stderr = "";

    const spinner = ora({
      text: ciColor(
        `${stepLabel} ▶ ${step.message}`,
        ciColors.bold,
        ciColors.blue,
      ),
      spinner: "dots",
      discardStdin: false,
      isSilent: !process.stdout.isTTY,
    }).start();

    const child = spawn("node", [stepPath], {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false,
      env: {
        ...process.env,
        ...extraEnv,
        FORCE_COLOR: "1",
      },
    });

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      const elapsed = Date.now() - started;

      ciDestroySpinner(spinner);

      console.error(
        ciColor(
          `❌ ${stepLabel} ${
            step.message
          } - failed to start after ${ciFormatDuration(elapsed)}`,
          ciColors.bold,
          ciColors.red,
        ),
      );

      console.error(error.message);

      console.log();

      stepResults.push({
        stepNumber,
        description: step.message,
        startedAt,
        duration: elapsed,
        status: "failed",
      });

      process.exit(1);
    });

    child.on("close", (code) => {
      const elapsed = Date.now() - started;

      if (code !== 0) {
        ciDestroySpinner(spinner);

        console.error(
          ciColor(
            `❌ ${stepLabel} ${step.message} - failed after ${ciFormatDuration(
              elapsed,
            )}`,
            ciColors.bold,
            ciColors.red,
          ),
        );

        ciFlushOutput({
          stdout,
          stderr,
        });

        console.error("");
        console.error(step.message);

        console.log();

        stepResults.push({
          stepNumber,
          description: step.message,
          startedAt,
          duration: elapsed,
          status: "failed",
        });

        process.exit(code ?? 1);
      }

      ciDestroySpinner(spinner);

      console.log(
        ciColor(
          `✅ ${stepLabel} ${step.message} - completed in ${ciFormatDuration(
            elapsed,
          )}`,
          ciColors.bold,
          ciColors.green,
        ),
      );

      ciFlushOutput({
        stdout,
        stderr,
      });

      console.log();

      stepResults.push({
        stepNumber,
        description: step.message,
        startedAt,
        duration: elapsed,
        status: "success",
      });

      resolve();
    });
  });
}

/**
 * Runs the package build pipeline.
 */
async function ciRunBuild() {
  const mode = process.argv[2] ?? "dev";

  if (!["dev", "prod"].includes(mode)) {
    console.error(`Invalid build mode: ${mode}`);
    console.error("Expected: dev or prod");
    process.exit(1);
  }

  const config = await ciLoadBuildConfig();
  const packageName = ciGetPackageName();
  const nodeEnv = mode === "prod" ? "production" : "development";
  const buildStarted = new Date();
  const steps = config.steps[mode];
  const stepResults = [];

  console.log("");
  console.log(
    ciColor(
      `🚀 ${packageName} ${nodeEnv} build started -- Start Time: ${ciFormatTime(
        buildStarted,
      )}`,
      ciColors.bold,
      ciColors.cyan,
    ),
  );
  // console.log(`🕒 Start Time: ${ciFormatTime(buildStarted)}`);
  console.log("");

  for (const [index, step] of steps.entries()) {
    await ciRunScript({
      step,
      stepNumber: index + 1,
      stepResults,
      extraEnv: {
        NODE_ENV: nodeEnv,
      },
    });
  }

  const buildFinished = new Date();
  const duration = buildFinished.getTime() - buildStarted.getTime();

  console.log("");
  console.log(
    ciColor(
      `🎉 ${packageName} ${nodeEnv} build completed successfully`,
      ciColors.bold,
      ciColors.green,
    ),
  );
  console.log("");

  ciPrintSummaryTable({
    buildStarted,
    buildFinished,
    duration,
    stepResults,
  });

  console.log("");
}

ciRunBuild();
