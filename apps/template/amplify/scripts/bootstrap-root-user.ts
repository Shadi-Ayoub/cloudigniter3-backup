import { fileURLToPath } from "node:url";

import { ciBootstrapRootUserFromAmplifyApp } from "@cloudigniter/aws/server/backend";

function ciReadOption(optionName: string): string | undefined {
  const optionIndex = process.argv.indexOf(optionName);

  if (optionIndex < 0) {
    return undefined;
  }

  const value = process.argv[optionIndex + 1]?.trim();

  if (!value) {
    throw new Error(`The ${optionName} option requires a value.`);
  }

  return value;
}

const appRoot = fileURLToPath(new URL("../..", import.meta.url));

try {
  const result = await ciBootstrapRootUserFromAmplifyApp({
    appRoot,
    profile: ciReadOption("--profile"),
  });

  console.log(
    result.cognitoUserCreated
      ? `Created root user "${result.email}" and its UserProfile.`
      : `Verified root user "${result.email}" and repaired its UserProfile if needed.`,
  );
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`Root-user bootstrap failed: ${message}`);
  process.exitCode = 1;
}
