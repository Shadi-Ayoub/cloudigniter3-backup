import type { CiResolveSettingsTableNameInput } from "@cloudigniter/core/server";

/**
 * Resolve the backing DynamoDB table name for a persistence-supported scope.
 *
 * @param input - Table resolution input.
 * @returns Matching table name.
 */
export function ciResolveSettingsTableName(
  input: CiResolveSettingsTableNameInput,
): string {
  const {
    scope,
    publicSettingsTableName,
    privateSettingsTableName,
    userSettingsTableName,
  } = input;

  if (scope === "public") {
    return publicSettingsTableName;
  }

  if (scope === "private") {
    return privateSettingsTableName;
  }

  return userSettingsTableName;
}
