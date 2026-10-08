import "server-only";

import {
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ciCreateAuthorizationSubject,
  ciCreateRoleAssignments,
  ciGlobalAccessScope,
  ciSystemAccessScope,
} from "@cloudigniter/core/lib";
import type {
  CiAdministratorManagementSubject,
  CiAuthorizationSubject,
  CiSecurityStoredRoleAssignment,
} from "@cloudigniter/core/types";
import type { CiNextContext } from "@cloudigniter/next/types";

/** Returns only grants that are active at the supplied instant. */
export function appIsUserAssignmentActive(
  assignment: Pick<CiSecurityStoredRoleAssignment, "validFrom" | "expiresAt">,
  now = new Date(),
): boolean {
  const instant = now.valueOf();
  const validFrom = assignment.validFrom
    ? Date.parse(assignment.validFrom)
    : Number.NEGATIVE_INFINITY;
  const expiresAt = assignment.expiresAt
    ? Date.parse(assignment.expiresAt)
    : Number.POSITIVE_INFINITY;
  return validFrom <= instant && instant < expiresAt;
}

/** Loads the actor's identity groups and active persisted assignments together. */
export function appCreateUserManagementAuthorizationSubject(
  context: CiNextContext,
  assignments: readonly CiSecurityStoredRoleAssignment[],
): CiAuthorizationSubject {
  const actorId = context.auth.user.id ?? "anonymous";
  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.subjectId === actorId && appIsUserAssignmentActive(assignment),
  );

  return ciCreateAuthorizationSubject(
    {
      id: actorId,
      authenticated: context.auth.user.authenticated,
    },
    [
      ...ciCreateRoleAssignments(
        context.auth.user.roles,
        ciSystemAccessScope(),
        "exact",
      ),
      ...ciCreateRoleAssignments(
        context.auth.user.roles,
        ciGlobalAccessScope(),
        "exact",
      ),
      ...activeAssignments,
    ],
  );
}

/** Provider-neutral administrator subject used by target hierarchy checks. */
export function appResolveAdministratorActor(
  context: CiNextContext,
  assignments: readonly CiSecurityStoredRoleAssignment[],
): CiAdministratorManagementSubject {
  const actorId = context.auth.user.id ?? "anonymous";
  const assignmentRoleIds = assignments
    .filter(
      (assignment) =>
        assignment.subjectId === actorId &&
        (assignment.scope.kind === "system" ||
          assignment.scope.kind === "global") &&
        appIsUserAssignmentActive(assignment),
    )
    .map((assignment) => assignment.roleId);

  return {
    id: actorId,
    effectiveRoleIds: Array.from(
      new Set([...context.auth.user.roles, ...assignmentRoleIds]),
    ),
    isRootUser: context.auth.user.isRootUser === true,
    canManageSystemSuperAdmins: appCanManageSystemSuperAdministrators(
      context,
      assignments,
    ),
  };
}

/** Delegation must be an active, exact, system-scoped assignment. */
export function appCanManageSystemSuperAdministrators(
  context: CiNextContext,
  assignments: readonly CiSecurityStoredRoleAssignment[],
): boolean {
  if (context.auth.user.isRootUser) return true;
  const actorId = context.auth.user.id ?? "anonymous";
  return assignments.some(
    (assignment) =>
      assignment.subjectId === actorId &&
      assignment.roleId === CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE &&
      assignment.scope.kind === "system" &&
      assignment.propagation === "exact" &&
      appIsUserAssignmentActive(assignment),
  );
}
