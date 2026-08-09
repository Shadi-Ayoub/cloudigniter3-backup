export type CiEmberguardCoreRole =
  | "SYSTEM_SUPER_ADMIN"
  | "SYSTEM_ADMIN"
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DEVELOPER"
  | "USER";

export const CI_CORE_ROLE_PRECEDENCE = {
  SYSTEM_SUPER_ADMIN: 0,
  SYSTEM_ADMIN: 10,
  SUPER_ADMIN: 20,
  ADMIN: 30,
  DEVELOPER: 40,
  USER: 50,
} as const satisfies Readonly<Record<CiEmberguardCoreRole, number>>;

export const CI_CORE_ROLES_BY_PRECEDENCE: readonly CiEmberguardCoreRole[] = Object.freeze(
  (Object.entries(CI_CORE_ROLE_PRECEDENCE) as [CiEmberguardCoreRole, number][])
    .sort(([, left], [, right]) => left - right)
    .map(([role]) => role),
);

export function ciResolvePrimaryRole(
  roles: readonly string[],
  rolePrecedence: Readonly<Record<string, number>> = CI_CORE_ROLE_PRECEDENCE,
): string | null {
  const normalizedPrecedence = new Map<string, number>();

  for (const [role, precedence] of Object.entries(rolePrecedence)) {
    if (Number.isFinite(precedence) && precedence >= 0) {
      normalizedPrecedence.set(role.trim().toUpperCase(), precedence);
    }
  }

  let primaryRole: string | null = null;
  let primaryPrecedence = Number.POSITIVE_INFINITY;

  for (const assignedRole of roles) {
    const normalizedRole = assignedRole.trim().toUpperCase();
    if (!normalizedRole) continue;

    const precedence = normalizedPrecedence.get(normalizedRole);
    if (precedence !== undefined && precedence < primaryPrecedence) {
      primaryRole = normalizedRole;
      primaryPrecedence = precedence;
    }
  }

  return primaryRole;
}
