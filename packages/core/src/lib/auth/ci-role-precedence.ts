import type { CiCoreRole } from "@ci-core/types";

/**
 * Canonical CloudIgniter role precedence.
 *
 * The values follow Amazon Cognito semantics: a lower number has higher
 * precedence. Gaps are intentional so applications can insert custom roles
 * between core roles without renumbering the complete hierarchy.
 */
export const CI_CORE_ROLE_PRECEDENCE = {
  SYSTEM_SUPER_ADMIN: 0,
  SYSTEM_ADMIN: 10,
  SUPER_ADMIN: 20,
  ADMIN: 30,
  DEVELOPER: 40,
  USER: 50,
} as const satisfies Readonly<Record<CiCoreRole, number>>;

/** Canonical core roles ordered from highest to lowest precedence. */
export const CI_CORE_ROLES_BY_PRECEDENCE: readonly CiCoreRole[] = Object.freeze(
  (Object.entries(CI_CORE_ROLE_PRECEDENCE) as [CiCoreRole, number][])
    .sort(([, left], [, right]) => left - right)
    .map(([role]) => role),
);

/**
 * Resolves the highest-precedence assigned role.
 *
 * Role matching is case-insensitive. Roles absent from the supplied precedence
 * map remain in the user's complete role list but cannot become the primary
 * role. If multiple roles have the same precedence, the first assigned role is
 * selected.
 */
export function ciResolvePrimaryRole(
  roles: readonly string[],
  rolePrecedence: Readonly<Record<string, number>> =
    CI_CORE_ROLE_PRECEDENCE,
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

    if (!normalizedRole) {
      continue;
    }

    const precedence = normalizedPrecedence.get(normalizedRole);

    if (precedence !== undefined && precedence < primaryPrecedence) {
      primaryRole = normalizedRole;
      primaryPrecedence = precedence;
    }
  }

  return primaryRole;
}
