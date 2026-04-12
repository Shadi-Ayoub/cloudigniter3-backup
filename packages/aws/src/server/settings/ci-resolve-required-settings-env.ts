import type { CiResolvedSettingsEnv } from "@cloudigniter/core/server";

/**
 * Resolve required environment variables for the settings service.
 *
 * @param env - Runtime environment object.
 * @returns Resolved settings environment values.
 * @throws Error when one or more required variables are missing.
 */
export function ciResolveRequiredSettingsEnv(
  env: Record<string, string | undefined>,
): CiResolvedSettingsEnv {
  const publicSettingsTableName = env.CI_PUBLIC_SETTINGS_TABLE_NAME;
  const privateSettingsTableName = env.CI_PRIVATE_SETTINGS_TABLE_NAME;
  const userSettingsTableName = env.CI_USER_SETTINGS_TABLE_NAME;

  if (!publicSettingsTableName) {
    throw new Error(
      "Missing required environment variable: CI_PUBLIC_SETTINGS_TABLE_NAME",
    );
  }

  if (!privateSettingsTableName) {
    throw new Error(
      "Missing required environment variable: CI_PRIVATE_SETTINGS_TABLE_NAME",
    );
  }

  if (!userSettingsTableName) {
    throw new Error(
      "Missing required environment variable: CI_USER_SETTINGS_TABLE_NAME",
    );
  }

  return {
    publicSettingsTableName,
    privateSettingsTableName,
    userSettingsTableName,
  };
}
