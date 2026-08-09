import type { CiSecurityIdentityGroup } from "@cloudigniter/emberguard/types";

/** Returns true when a value is a non-null object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Reads the optional numeric precedence from an Amplify group entry. */
function readPrecedence(value: unknown): number | undefined {
  if (!isRecord(value) || typeof value.precedence !== "number") {
    return undefined;
  }
  return value.precedence;
}

/** Converts Amplify/Cognito group output into provider-neutral group metadata. */
export function ciResolveAwsCognitoIdentityGroups(
  amplifyOutputs: unknown
): CiSecurityIdentityGroup[] {
  if (!isRecord(amplifyOutputs) || !isRecord(amplifyOutputs.auth)) {
    return [];
  }
  const groups = amplifyOutputs.auth.groups;
  if (!Array.isArray(groups)) {
    return [];
  }

  return groups.flatMap((group) => {
    if (!isRecord(group)) {
      return [];
    }
    return Object.entries(group).map(([id, config]) => ({
      id,
      provider: "AWS",
      precedence: readPrecedence(config),
    }));
  });
}
