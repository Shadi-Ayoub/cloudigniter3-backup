export type CiSecurityRoleInheritanceOption = {
  id: string;
  inherits: readonly string[];
};

/** Returns whether one role directly or transitively inherits a target role. */
export function ciSecurityRoleInherits(
  roleId: string,
  targetRoleId: string,
  roles: readonly CiSecurityRoleInheritanceOption[],
): boolean {
  const inheritance = new Map(roles.map((role) => [role.id, role.inherits]));
  const visited = new Set<string>();

  /** Traverses one inheritance branch without trusting catalog acyclicity. */
  function visit(candidateId: string): boolean {
    if (candidateId === targetRoleId) return true;
    if (visited.has(candidateId)) return false;
    visited.add(candidateId);
    return (inheritance.get(candidateId) ?? []).some(visit);
  }

  return visit(roleId);
}

/** Filters direct-inheritance suggestions that would duplicate or cycle. */
export function ciGetAvailableInheritedRoleOptions<
  Option extends CiSecurityRoleInheritanceOption,
>(
  currentRoleId: string,
  selectedRoleIds: readonly string[],
  roles: readonly Option[],
): Option[] {
  const selected = new Set(selectedRoleIds);
  const inheritance = new Map(roles.map((role) => [role.id, role.inherits]));

  /** Checks whether one candidate reaches the edited role. */
  function candidateInheritsCurrentRole(candidateRoleId: string): boolean {
    const visited = new Set<string>();

    /** Traverses one candidate branch defensively. */
    function visit(roleId: string): boolean {
      if (roleId === currentRoleId) return true;
      if (visited.has(roleId)) return false;
      visited.add(roleId);
      return (inheritance.get(roleId) ?? []).some(visit);
    }

    return visit(candidateRoleId);
  }

  return roles.filter(
    (role) =>
      role.id !== currentRoleId &&
      !selected.has(role.id) &&
      !candidateInheritsCurrentRole(role.id),
  );
}
