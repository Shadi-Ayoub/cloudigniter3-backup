import { readFile } from "node:fs/promises";
import path from "node:path";

import { LambdaClient } from "@aws-sdk/client-lambda";

import { ciBootstrapAccessControl } from "./ci-bootstrap-access-control";
import { ciResolveAccessControlBootstrapFunction } from "./ci-resolve-access-control-bootstrap-function";
import type {
  CiBootstrapAccessControlFromAmplifyAppInput,
  CiBootstrapAccessControlResult,
} from "./types";

type CiAmplifyOutputs = {
  auth?: { aws_region?: unknown };
  custom?: {
    cloudigniter?: {
      emberguardAccessTableName?: unknown;
      emberguardAccessBootstrapFunctionName?: unknown;
    };
  };
};

function ciIsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ciRequireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `[ciBootstrapAccessControlFromAmplifyApp] Missing required configuration "${field}".`,
    );
  }
  return value.trim();
}

function ciOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `[ciBootstrapAccessControlFromAmplifyApp] Invalid configuration "${field}".`,
    );
  }
  return value.trim();
}

/** Loads deployed outputs and initializes the application's access-control state. */
export async function ciBootstrapAccessControlFromAmplifyApp(
  input: CiBootstrapAccessControlFromAmplifyAppInput = {},
): Promise<CiBootstrapAccessControlResult> {
  const appRoot = path.resolve(input.appRoot ?? process.cwd());
  const amplifyOutputsPath = path.resolve(
    input.amplifyOutputsPath ?? path.join(appRoot, "amplify_outputs.json"),
  );

  if (input.profile) process.env.AWS_PROFILE = input.profile;

  let value: unknown;
  try {
    value = JSON.parse(await readFile(amplifyOutputsPath, "utf8")) as unknown;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[ciBootstrapAccessControlFromAmplifyApp] Failed to read "${amplifyOutputsPath}": ${message}`,
    );
  }
  if (!ciIsRecord(value)) {
    throw new Error(
      `[ciBootstrapAccessControlFromAmplifyApp] "${amplifyOutputsPath}" must contain a JSON object.`,
    );
  }

  const outputs = value as CiAmplifyOutputs;
  const region = ciRequireString(outputs.auth?.aws_region, "auth.aws_region");
  const accessControlTableName = ciRequireString(
    outputs.custom?.cloudigniter?.emberguardAccessTableName,
    "custom.cloudigniter.emberguardAccessTableName",
  );
  const client = new LambdaClient({ region });
  const bootstrapFunctionName =
    ciOptionalString(
      outputs.custom?.cloudigniter?.emberguardAccessBootstrapFunctionName,
      "custom.cloudigniter.emberguardAccessBootstrapFunctionName",
    ) ??
    (await ciResolveAccessControlBootstrapFunction({
      accessControlTableName,
      client,
    }));

  return ciBootstrapAccessControl(
    { region, bootstrapFunctionName, accessControlTableName },
    client,
  );
}
