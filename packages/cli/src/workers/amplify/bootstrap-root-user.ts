import path from "node:path";

import { ciImportPackageEntry } from "../../runtime/ci-import-package-entry.mjs";

type CiAwsBackendModule = {
  ciBootstrapRootUserFromAmplifyApp(input: {
    appRoot: string;
    profile?: string;
  }): Promise<{
    cognitoUserCreated: boolean;
    email: string;
  }>;
};

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

const appRoot = path.resolve(ciReadOption("--app-root") ?? process.cwd());

try {
  const { ciBootstrapRootUserFromAmplifyApp } =
    await ciImportPackageEntry<CiAwsBackendModule>({
      baseDirectory: appRoot,
      packageName: "@cloudigniter/aws",
      subpath: "server/backend",
    });
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
