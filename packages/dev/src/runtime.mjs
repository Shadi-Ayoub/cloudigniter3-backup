import { execa } from "execa";
import { ciResolveGithubCli } from "./github-cli.mjs";

export class CiDevUsageError extends Error {}

export class CiDevWorkerError extends Error {
  /** @param {string} message @param {number} exitCode */
  constructor(message, exitCode) {
    super(message);
    this.exitCode = exitCode;
  }
}

/** @type {import('./types.d.mts').Runner} */
export async function ciRun(command, args, cwd, options = {}) {
  const executable = command === "gh"
    ? await ciResolveGithubCli({ ...process.env, ...options.env }, cwd)
    : command;
  const result = await execa(executable, args, {
    cwd,
    shell: false,
    preferLocal: false,
    input: options.input,
    ...(options.interactive ? { stdio: "inherit" } : {}),
    timeout: options.timeout ?? 120_000,
    env: {
      ...options.env,
      GH_PROMPT_DISABLED: options.interactive ? undefined : "1",
      GIT_TERMINAL_PROMPT: options.interactive ? "1" : "0",
    },
  });
  return result.stdout ?? "";
}

/** @param {unknown} error */
export function ciErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
