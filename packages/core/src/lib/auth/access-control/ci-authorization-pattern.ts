import type { CiAccessRequirement } from "@ci-core/types";

/** Matches dot-delimited identifiers with Shield-style segment wildcards. */
export function ciMatchesAuthorizationPattern(pattern: string, value: string): boolean {
  const patternSegments = pattern.split(".");
  const valueSegments = value.split(".");
  const trailingWildcard = patternSegments.at(-1) === "*";

  if (trailingWildcard) {
    if (valueSegments.length < patternSegments.length) {
      return false;
    }
  } else if (patternSegments.length !== valueSegments.length) {
    return false;
  }

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];

    if (patternSegment === "*" && trailingWildcard && index === patternSegments.length - 1) {
      return true;
    }

    if (patternSegment !== "*" && patternSegment !== valueSegments[index]) {
      return false;
    }
  }

  return true;
}

/** Formats a resource and action using the familiar Shield permission syntax. */
export function ciFormatPermission(resource: string, action: string): string {
  return `${resource}.${action}`;
}

/** Parses a Shield-style permission by treating its final segment as the action. */
export function ciParsePermission(permission: string): CiAccessRequirement | null {
  const separatorIndex = permission.lastIndexOf(".");

  if (separatorIndex <= 0 || separatorIndex === permission.length - 1) {
    return null;
  }

  return {
    resource: permission.slice(0, separatorIndex),
    action: permission.slice(separatorIndex + 1),
  };
}

/** Checks whether a Shield-style permission pattern covers a requested permission. */
export function ciMatchesPermission(permissionPattern: string, permission: string): boolean {
  return ciMatchesAuthorizationPattern(permissionPattern, permission);
}
