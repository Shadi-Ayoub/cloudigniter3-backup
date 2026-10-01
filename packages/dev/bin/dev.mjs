#!/usr/bin/env node
import { ciRunDevCli } from "../src/cli.mjs";
import {
  CiDevUsageError,
  CiDevWorkerError,
  ciErrorMessage,
} from "../src/runtime.mjs";
import { ciIsRecord } from "../src/policy.mjs";

process.on("unhandledRejection", (error) => {
  throw error;
});
try {
  await ciRunDevCli();
} catch (error) {
  const message = ciErrorMessage(error);
  if (process.argv.includes("--json"))
    console.error(JSON.stringify({ error: message }));
  else console.error(`dev: ${message}`);
  if (
    (process.argv.includes("--verbose") || process.argv.includes("-v")) &&
    error instanceof Error
  )
    console.error(error.stack);
  process.exitCode =
    error instanceof CiDevUsageError
      ? 2
      : ciIsRecord(error) && error.name === "CancelPromptError"
      ? 130
      : error instanceof CiDevWorkerError
      ? error.exitCode
      : 1;
}
