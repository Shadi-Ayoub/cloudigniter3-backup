export type CiEmberguardCoreRole =
  | "system-super-admin"
  | "system-admin"
  | "super-admin"
  | "admin"
  | "developer"
  | "user";

export const CI_CORE_ROLE_PRECEDENCE = {
  "system-super-admin": 0,
  "system-admin": 10,
  "super-admin": 20,
  admin: 30,
  developer: 40,
  user: 50,
} as const satisfies Readonly<Record<CiEmberguardCoreRole, number>>;

export const CI_CORE_ROLES_BY_PRECEDENCE: readonly CiEmberguardCoreRole[] =
  Object.freeze(
    (
      Object.entries(CI_CORE_ROLE_PRECEDENCE) as [
        CiEmberguardCoreRole,
        number
      ][]
    )
      .sort(([, left], [, right]) => left - right)
      .map(([role]) => role)
  );

export function ciResolvePrimaryRole(
  roles: readonly string[],
  rolePrecedence: Readonly<Record<string, number>> = CI_CORE_ROLE_PRECEDENCE
): string | null {
  const normalizedPrecedence = new Map<string, number>();

  for (const [role, precedence] of Object.entries(rolePrecedence)) {
    if (Number.isFinite(precedence) && precedence >= 0) {
      normalizedPrecedence.set(role.trim(), precedence);
    }
  }

  let primaryRole: string | null = null;
  let primaryPrecedence = Number.POSITIVE_INFINITY;

  for (const assignedRole of roles) {
    const normalizedRole = assignedRole.trim();
    if (!normalizedRole) continue;

    const precedence = normalizedPrecedence.get(normalizedRole);
    if (precedence !== undefined && precedence < primaryPrecedence) {
      primaryRole = normalizedRole;
      primaryPrecedence = precedence;
    }
  }

  return primaryRole;
}
