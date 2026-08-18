import { access, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import enquirer from "enquirer";
import { execa, execaNode } from "execa";
import ora from "ora";
import pc from "picocolors";

const ciCliDirectory = path.dirname(fileURLToPath(import.meta.url));
const ciRequire = createRequire(import.meta.url);
const ciTsxImportUrl = pathToFileURL(ciRequire.resolve("tsx")).href;
export const ciCliPackageRoot = path.resolve(ciCliDirectory, "../..");
export const ciWorkerRoot = path.join(ciCliPackageRoot, "src/workers");

export class CiCliUsageError extends Error {}

export function ciClearTerminal(enabled) {
  if (enabled && process.stdout.isTTY) {
    process.stdout.write("\u001B[2J\u001B[0;0H");
  }
}

export function ciPrintWelcome({ developer = false } = {}) {
  const label = developer ? "CloudIgniter Developer Toolkit" : "CloudIgniter";
  const subtitle = developer
    ? "Workspace build, quality, and release operations"
    : "Application and system operations toolkit";

  console.log();
  console.log(pc.bold(pc.cyan(`  ${label}`)));
  console.log(pc.dim(`  ${subtitle}`));
  console.log();
}

export function ciPrintAlert(type, message) {
  const styles = {
    success: ["✔", pc.green],
    info: ["ℹ", pc.cyan],
    warning: ["⚠", pc.yellow],
    error: ["✖", pc.red],
  };
  const [symbol, color] = styles[type] ?? styles.info;
  const writer = type === "error" ? console.error : console.log;
  writer(`${color(symbol)} ${message}`);
}

export async function ciPathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ciFindWorkspaceRoot(startDirectory = process.cwd()) {
  let directory = path.resolve(startDirectory);

  while (true) {
    if (await ciPathExists(path.join(directory, "pnpm-workspace.yaml"))) {
      return directory;
    }

    const parent = path.dirname(directory);
    if (parent === directory) return path.resolve(startDirectory);
    directory = parent;
  }
}

export async function ciAssertDeveloperWorkspace(workspaceRoot) {
  const manifestPath = path.join(workspaceRoot, "package.json");
  let manifest;

  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    throw new CiCliUsageError(
      `Developer commands require a CloudIgniter workspace; no package.json was found at ${workspaceRoot}.`,
    );
  }

  if (
    manifest.name !== "cloudigniter" ||
    manifest.private !== true ||
    !(await ciPathExists(path.join(workspaceRoot, "packages/cli/package.json")))
  ) {
    throw new CiCliUsageError(
      `Developer commands are only available inside the private CloudIgniter monorepo (${workspaceRoot}).`,
    );
  }
}

export async function ciPromptSelect({ message, choices, disabled = false }) {
  if (disabled || !process.stdin.isTTY || !process.stdout.isTTY) return undefined;
  const answer = await enquirer.prompt({ type: "select", name: "value", message, choices });
  return answer.value;
}

export async function ciPromptInput({ message, disabled = false }) {
  if (disabled || !process.stdin.isTTY || !process.stdout.isTTY) return undefined;
  const answer = await enquirer.prompt({ type: "input", name: "value", message });
  return answer.value?.trim() || undefined;
}

export async function ciRunWorker({
  worker,
  args = [],
  cwd = process.cwd(),
  workspaceRoot,
  spinnerText,
  verbose = false,
}) {
  const workerPath = path.join(ciWorkerRoot, worker);
  const env = {
    ...process.env,
    CLOUDIGNITER_WORKSPACE_ROOT: workspaceRoot,
    CI_VERBOSE: verbose ? "1" : process.env.CI_VERBOSE,
  };

  if (!spinnerText) {
    await execaNode(workerPath, args, {
      cwd,
      env,
      nodeOptions: [`--import=${ciTsxImportUrl}`],
      stdio: "inherit",
    });
    return;
  }

  const spinner = ora({ text: spinnerText, isSilent: !process.stdout.isTTY }).start();

  try {
    const result = await execaNode(workerPath, args, {
      cwd,
      env,
      nodeOptions: [`--import=${ciTsxImportUrl}`],
    });
    spinner.succeed(spinnerText);
    if (result.stdout) console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
  } catch (error) {
    spinner.fail(spinnerText);
    throw error;
  }
}

export async function ciRunLocalCommand({ command, args, cwd, env }) {
  await execa(command, args, {
    cwd,
    env: { ...process.env, ...env },
    preferLocal: true,
    stdio: "inherit",
  });
}

export async function ciHandleCliError(error, { verbose = false } = {}) {
  if (error?.name === "CancelPromptError") {
    ciPrintAlert("warning", "Operation cancelled.");
    process.exitCode = 130;
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  ciPrintAlert("error", message);

  if (verbose && error instanceof Error && error.stack) {
    console.error(pc.dim(error.stack));
  }

  process.exitCode = error instanceof CiCliUsageError ? 2 : 1;
}

export function ciInstallUnhandledErrorGuards() {
  process.on("unhandledRejection", (reason) => {
    throw reason;
  });
}
