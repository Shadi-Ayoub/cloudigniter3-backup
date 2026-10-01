import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import enquirer from "enquirer";
import { execa, execaNode } from "execa";
import { ciFindWorkspace, ciIsRecord } from "./policy.mjs";
import {
  CiDevUsageError,
  CiDevWorkerError,
  ciErrorMessage,
} from "./runtime.mjs";

const require = createRequire(import.meta.url);
const tsxUrl = pathToFileURL(require.resolve("tsx")).href;
const workerRoot = fileURLToPath(new URL("./workers/", import.meta.url));

/** @param {string} start */
export async function ciAssertDeveloperWorkspace(start) {
  const root = await ciFindWorkspace(start);
  let manifest;
  try {
    manifest = JSON.parse(
      await readFile(path.join(root, "packages/dev/package.json"), "utf8"),
    );
  } catch {
    throw new CiDevUsageError(
      "Developer commands require packages/dev in the CloudIgniter workspace.",
    );
  }
  if (!ciIsRecord(manifest) || manifest.name !== "@cloudigniter/dev")
    throw new CiDevUsageError(
      "Developer commands require the CloudIgniter DEV package.",
    );
  return root;
}

/** @param {{message: string, choices: string[], interactive: boolean}} input */
export async function ciPromptSelect({ message, choices, interactive }) {
  if (!interactive || !process.stdin.isTTY || !process.stdout.isTTY)
    return undefined;
  const answer = await enquirer.prompt({
    type: "select",
    name: "value",
    message,
    choices,
  });
  if (!ciIsRecord(answer) || typeof answer.value !== "string")
    throw new CiDevUsageError(
      "No selection received. Supply an explicit flag.",
    );
  return answer.value;
}

/** @param {{worker: string, args?: string[], workspaceRoot: string, verbose?: boolean}} input */
export async function ciRunWorker({
  worker,
  args = [],
  workspaceRoot,
  verbose = false,
}) {
  try {
    await execaNode(path.join(workerRoot, worker), args, {
      cwd: process.cwd(),
      shell: false,
      nodePath: process.execPath,
      nodeOptions: [`--import=${tsxUrl}`],
      stdio: "inherit",
      env: {
        CLOUDIGNITER_WORKSPACE_ROOT: workspaceRoot,
        CI_VERBOSE: verbose ? "1" : process.env.CI_VERBOSE,
      },
    });
  } catch (error) {
    const exitCode =
      ciIsRecord(error) &&
      typeof error.exitCode === "number" &&
      error.exitCode > 0
        ? error.exitCode
        : 1;
    throw new CiDevWorkerError(ciErrorMessage(error), exitCode);
  }
}

/** @param {{command: string, args: string[], cwd: string, env?: Record<string, string>}} input */
export async function ciRunLocalCommand({ command, args, cwd, env }) {
  try {
    await execa(command, args, {
      cwd,
      env,
      shell: false,
      preferLocal: true,
      stdio: "inherit",
    });
  } catch (error) {
    const exitCode =
      ciIsRecord(error) &&
      typeof error.exitCode === "number" &&
      error.exitCode > 0
        ? error.exitCode
        : 1;
    throw new CiDevWorkerError(ciErrorMessage(error), exitCode);
  }
}
