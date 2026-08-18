import type {
  CiAccessScope,
  CiAuthorizationSubject,
  CiGrantWindow,
  CiPrivilege,
  CiRoleAssignment,
  CiScopedPrivilege,
  CiScopePropagation,
} from "../../types";

import { ciIsAccessControlKebabIdentifier } from "./ci-access-control-identifiers";

/** Creates a scoped role assignment with an explicit propagation policy. */
export function ciCreateRoleAssignment(
  roleId: string,
  scope: CiAccessScope,
  propagation: CiScopePropagation,
  window: CiGrantWindow = {}
): CiRoleAssignment {
  if (!ciIsAccessControlKebabIdentifier(roleId)) {
    throw new Error(
      "Role identifiers must use lowercase kebab case, start with a letter, and contain only lowercase letters, digits, and single hyphens."
    );
  }
  return {
    roleId,
    scope,
    propagation,
    ...window,
  };
}

/** Creates equivalent scoped assignments for a list of ARBAC role identifiers. */
export function ciCreateRoleAssignments(
  roleIds: readonly string[],
  scope: CiAccessScope,
  propagation: CiScopePropagation,
  window: CiGrantWindow = {}
): readonly CiRoleAssignment[] {
  return roleIds.map((roleId) =>
    ciCreateRoleAssignment(roleId, scope, propagation, window)
  );
}

/** Creates a direct subject privilege with an explicit access boundary. */
export function ciCreateScopedPrivilege(
  privilege: CiPrivilege,
  scope: CiAccessScope,
  propagation: CiScopePropagation,
  window: CiGrantWindow = {}
): CiScopedPrivilege {
  return {
    privilege,
    scope,
    propagation,
    ...window,
  };
}

/** Adapts CloudIgniter user identity data and resolved grants to the engine subject. */
export function ciCreateAuthorizationSubject(
  user: { id: string; authenticated: boolean },
  roleAssignments: readonly CiRoleAssignment[],
  directPrivileges: readonly CiScopedPrivilege[] = []
): CiAuthorizationSubject {
  return {
    id: user.id,
    authenticated: user.authenticated,
    roleAssignments,
    directPrivileges,
  };
}
