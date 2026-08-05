import { readFile } from "node:fs/promises";
import path from "node:path";
import { stderr, stdin } from "node:process";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

import { ciBootstrapRootUser } from "./ci-bootstrap-root-user";
import { ciGetRootUserPasswordProblems } from "./ci-get-root-user-password-problems";
import type {
  CiBootstrapRootUserFromAmplifyAppInput,
  CiBootstrapRootUserResult,
  CiRootUserConfig,
  CiRootUserPasswordPolicy,
} from "./types";

type CiAmplifyOutputs = {
  auth?: {
    user_pool_id?: unknown;
    aws_region?: unknown;
    password_policy?: {
      min_length?: unknown;
      require_lowercase?: unknown;
      require_uppercase?: unknown;
      require_numbers?: unknown;
      require_symbols?: unknown;
    };
  };
  custom?: {
    cloudigniter?: {
      userProfileTableName?: unknown;
    };
  };
};

function ciIsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ciRequireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `[ciBootstrapRootUserFromAmplifyApp] Missing required configuration "${field}".`,
    );
  }

  return value.trim();
}

async function ciReadJson(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as unknown;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `[ciBootstrapRootUserFromAmplifyApp] Failed to read "${filePath}": ${message}`,
    );
  }
}

async function ciReadRootUserConfig(
  filePath: string,
): Promise<CiRootUserConfig> {
  const value = await ciReadJson(filePath);

  if (!ciIsRecord(value)) {
    throw new Error(
      `[ciBootstrapRootUserFromAmplifyApp] "${filePath}" must contain a JSON object.`,
    );
  }

  return {
    email: ciRequireString(value.email, "rootUser.email"),
    givenName: ciRequireString(value.givenName, "rootUser.givenName"),
    familyName: ciRequireString(value.familyName, "rootUser.familyName"),
  };
}

function ciReadOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function ciReadOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function ciMapPasswordPolicy(
  outputs: CiAmplifyOutputs,
): CiRootUserPasswordPolicy {
  const policy = outputs.auth?.password_policy;

  return {
    minLength: ciReadOptionalNumber(policy?.min_length),
    requireLowercase: ciReadOptionalBoolean(policy?.require_lowercase),
    requireUppercase: ciReadOptionalBoolean(policy?.require_uppercase),
    requireNumbers: ciReadOptionalBoolean(policy?.require_numbers),
    requireSymbols: ciReadOptionalBoolean(policy?.require_symbols),
  };
}

async function ciReadAmplifyOutputs(
  filePath: string,
): Promise<CiAmplifyOutputs> {
  const value = await ciReadJson(filePath);

  if (!ciIsRecord(value)) {
    throw new Error(
      `[ciBootstrapRootUserFromAmplifyApp] "${filePath}" must contain a JSON object.`,
    );
  }

  return value as CiAmplifyOutputs;
}

async function ciPromptForHiddenValue(message: string): Promise<string> {
  if (!stdin.isTTY || !stderr.isTTY) {
    throw new Error(
      "[ciBootstrapRootUserFromAmplifyApp] A terminal is required to enter the root password.",
    );
  }

  const silentOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
  const reader = createInterface({
    input: stdin,
    output: silentOutput,
    terminal: true,
  });

  stderr.write(message);

  try {
    return await reader.question("");
  } finally {
    reader.close();
    stderr.write("\n");
  }
}

async function ciPromptForRootUserPassword(
  passwordPolicy: CiRootUserPasswordPolicy,
): Promise<string> {
  while (true) {
    const password = await ciPromptForHiddenValue("Root password: ");
    const passwordProblems = ciGetRootUserPasswordProblems(
      password,
      passwordPolicy,
    );

    if (passwordProblems.length > 0) {
      stderr.write(
        `Password must contain ${passwordProblems.join(
          ", ",
        )}. Please try again.\n`,
      );
      continue;
    }

    const confirmation = await ciPromptForHiddenValue(
      "Confirm root password: ",
    );

    if (password === confirmation) {
      return password;
    }

    stderr.write("Passwords do not match. Please try again.\n");
  }
}

/**
 * Loads an Amplify application's deployed outputs and custom root-user config,
 * then creates or repairs the root Cognito user and DynamoDB profile.
 */
export async function ciBootstrapRootUserFromAmplifyApp(
  input: CiBootstrapRootUserFromAmplifyAppInput = {},
): Promise<CiBootstrapRootUserResult> {
  const appRoot = path.resolve(input.appRoot ?? process.cwd());
  const rootUserConfigPath = path.resolve(
    input.rootUserConfigPath ??
      path.join(appRoot, "amplify", "custom", "root-user.json"),
  );
  const amplifyOutputsPath = path.resolve(
    input.amplifyOutputsPath ?? path.join(appRoot, "amplify_outputs.json"),
  );

  if (input.profile) {
    process.env.AWS_PROFILE = input.profile;
  }

  const [rootUser, outputs] = await Promise.all([
    ciReadRootUserConfig(rootUserConfigPath),
    ciReadAmplifyOutputs(amplifyOutputsPath),
  ]);
  const passwordPolicy = ciMapPasswordPolicy(outputs);

  return ciBootstrapRootUser({
    region: ciRequireString(outputs.auth?.aws_region, "auth.aws_region"),
    userPoolId: ciRequireString(
      outputs.auth?.user_pool_id,
      "auth.user_pool_id",
    ),
    userProfileTableName: ciRequireString(
      outputs.custom?.cloudigniter?.userProfileTableName,
      "custom.cloudigniter.userProfileTableName",
    ),
    rootUser,
    passwordPolicy,
    passwordProvider:
      input.passwordProvider ??
      (() => ciPromptForRootUserPassword(passwordPolicy)),
  });
}
