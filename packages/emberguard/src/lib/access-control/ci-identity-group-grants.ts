import type {
  CiAccessControlDefinition,
  CiAccessScope,
  CiIdentityGroupRoleMappingOptions,
  CiIdentityGroupRoleResolutionOptions,
  CiRoleAssignment,
  CiScopePropagation,
} from "../../types";

import { ciCreateRoleAssignments } from "./ci-authorization-grants";

/** Tests whether a role-map entry was explicitly supplied for a provider group. */
function hasMappedGroup(
  roleMap: Readonly<Record<string, string | null>>,
  groupId: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(roleMap, groupId);
}

/**
 * Resolves identity-provider group names to known ARBAC role identifiers.
 *
 * Group matching and aliases are case-sensitive. Unknown groups are ignored by
 * default so unrelated provider groups do not acquire application privileges.
 */
export function ciResolveIdentityGroupRoles(
  groupIds: readonly string[] | null | undefined,
  definition: Pick<CiAccessControlDefinition, "roles">,
  options: CiIdentityGroupRoleResolutionOptions = {},
): readonly string[] {
  const knownRoleIds = new Set(definition.roles.map((role) => role.id));
  const roleMap = options.roleMap ?? {};
  const roleIds = new Set<string>();

  for (const groupId of groupIds ?? []) {
    const mappedRoleId = hasMappedGroup(roleMap, groupId) ? roleMap[groupId] : groupId;

    if (mappedRoleId === null) {
      continue;
    }

    if (!mappedRoleId || !knownRoleIds.has(mappedRoleId)) {
      if (options.unknownGroupStrategy === "throw") {
        throw new Error(
          `Identity group "${groupId}" maps to unknown access-control role "${mappedRoleId ?? ""}".`,
        );
      }

      continue;
    }

    roleIds.add(mappedRoleId);
  }

  return [...roleIds];
}

/**
 * Converts identity-provider groups into deduplicated, scoped role assignments.
 *
 * The catalog remains authoritative for role precedence and privileges; the
 * provider contributes group membership only.
 */
export function ciCreateRoleAssignmentsFromIdentityGroups(
  groupIds: readonly string[] | null | undefined,
  definition: Pick<CiAccessControlDefinition, "roles">,
  scope: CiAccessScope,
  propagation: CiScopePropagation,
  options: CiIdentityGroupRoleMappingOptions = {},
): readonly CiRoleAssignment[] {
  const roleIds = ciResolveIdentityGroupRoles(groupIds, definition, options);

  return ciCreateRoleAssignments(roleIds, scope, propagation, options.window);
}
