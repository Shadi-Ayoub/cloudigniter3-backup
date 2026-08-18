import path from "node:path";

import { ciImportPackageEntry } from "../../runtime/ci-import-package-entry.mjs";

type CiAwsBackendModule = {
  ciBootstrapAccessControlFromAmplifyApp(input: {
    appRoot: string;
    profile?: string;
  }): Promise<{
    created: boolean;
    accessControlTableName: string;
  }>;
};

function ciReadOption(optionName: string): string | undefined {
  const optionIndex = process.argv.indexOf(optionName);
  if (optionIndex < 0) return undefined;

  const value = process.argv[optionIndex + 1]?.trim();
  if (!value) throw new Error(`The ${optionName} option requires a value.`);
  return value;
}

const appRoot = path.resolve(ciReadOption("--app-root") ?? process.cwd());

try {
  const { ciBootstrapAccessControlFromAmplifyApp } =
    await ciImportPackageEntry<CiAwsBackendModule>({
      baseDirectory: appRoot,
      packageName: "@cloudigniter/aws",
      subpath: "server/backend",
    });
  const result = await ciBootstrapAccessControlFromAmplifyApp({
    appRoot,
    profile: ciReadOption("--profile"),
  });

  console.log(
    result.created
      ? `Created the default access-control definition in "${result.accessControlTableName}".`
      : `Verified the access-control definition in "${result.accessControlTableName}".`,
  );
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Access-control bootstrap failed: ${message}`);
  process.exitCode = 1;
}
