import type {
  CiAccessControlDefinition,
  CiSecurityRoleCountersById,
  CiSecurityStoredRoleAssignment,
} from "../../types";

/**
 * Builds the compact role-counter projection persisted after security writes.
 *
 * User counts describe stored assignment relationships. A subject is counted
 * once per role regardless of how many scoped assignments create that
 * relationship. Suspended roles remain directly assigned but do not create an
 * effective inheritance path.
 */
export function ciBuildSecurityRoleCounters(
  definition: CiAccessControlDefinition,
  assignments: readonly CiSecurityStoredRoleAssignment[]
): CiSecurityRoleCountersById {
  const roleById = new Map(definition.roles.map((role) => [role.id, role]));
  const subjectsByRoleId = new Map<string, Set<string>>();

  for (const assignment of assignments) {
    if (!roleById.has(assignment.roleId)) continue;
    const subjects = subjectsByRoleId.get(assignment.roleId) ?? new Set();
    subjects.add(assignment.subjectId);
    subjectsByRoleId.set(assignment.roleId, subjects);
  }

  /** Checks whether a non-suspended inheritance path reaches a target role. */
  function effectivelyInheritsRole(
    roleId: string,
    targetRoleId: string,
    visiting: ReadonlySet<string>
  ): boolean {
    if (visiting.has(roleId)) return false;
    const role = roleById.get(roleId);
    if (!role || role.status === "suspended") return false;

    const nextVisiting = new Set(visiting).add(roleId);
    return (role.inherits ?? []).some((inheritedRoleId) => {
      const inheritedRole = roleById.get(inheritedRoleId);
      if (!inheritedRole || inheritedRole.status === "suspended") return false;
      return (
        inheritedRoleId === targetRoleId ||
        effectivelyInheritsRole(inheritedRoleId, targetRoleId, nextVisiting)
      );
    });
  }

  return Object.fromEntries(
    definition.roles.map((role) => {
      const directSubjects = subjectsByRoleId.get(role.id) ?? new Set<string>();
      const inheritedSubjects = new Set<string>();

      if (role.status !== "suspended") {
        for (const [assignedRoleId, subjects] of subjectsByRoleId) {
          if (
            assignedRoleId === role.id ||
            !effectivelyInheritsRole(assignedRoleId, role.id, new Set())
          ) {
            continue;
          }
          for (const subjectId of subjects) {
            if (!directSubjects.has(subjectId))
              inheritedSubjects.add(subjectId);
          }
        }
      }

      return [
        role.id,
        {
          permissionCount: role.privileges.length,
          directUserCount: directSubjects.size,
          inheritedUserCount: inheritedSubjects.size,
        },
      ];
    })
  );
}
