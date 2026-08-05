import type { CiRoleAssignment } from "./CiRoleAssignment";
import type { CiScopedPrivilege } from "./CiScopedPrivilege";

/** Provider-neutral identity data required to evaluate authorization. */
export type CiAuthorizationSubject = {
  id: string | null;
  authenticated: boolean;
  roleAssignments: readonly CiRoleAssignment[];
  directPrivileges?: readonly CiScopedPrivilege[];
};
