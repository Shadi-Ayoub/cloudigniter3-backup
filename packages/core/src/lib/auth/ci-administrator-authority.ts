import type {
  CiAdministratorManagementSubject,
  CiAdministratorRole,
  CiCanManageAdministratorInput,
} from "@ci-core/types";

/** Administrator roles ordered from lowest to highest management authority. */
export const CI_ADMINISTRATOR_ROLES = Object.freeze([
  "admin",
  "super-admin",
  "system-admin",
  "system-super-admin",
] as const satisfies readonly CiAdministratorRole[]);

/**
 * Reserved identity-group marker for the deployment owner (Root User).
 *
 * Identity-provider adapters should project this marker to `isRootUser` before
 * invoking the provider-neutral policy helpers in this module.
 */
export const CI_ROOT_USER_IDENTITY_GROUP = "cloudigniter-root-user" as const;

/**
 * Assignment-only role that delegates management of system super admins.
 *
 * This is intentionally not a `CiCoreRole` or an identity-provider group.
 */
export const CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE =
  "system-super-admin-manager" as const;

/**
 * Target-management authority, distinct from Cognito/core role precedence.
 * Higher values represent greater administrator management authority.
 */
export const CI_ADMINISTRATOR_AUTHORITY_RANKS = Object.freeze({
  admin: 1,
  "super-admin": 2,
  "system-admin": 3,
  "system-super-admin": 4,
} as const satisfies Readonly<Record<CiAdministratorRole, number>>);

const administratorRoleIds: ReadonlySet<string> = new Set(
  CI_ADMINISTRATOR_ROLES,
);

/** Returns whether a role ID is a canonical administrator role. */
export function ciIsAdministratorRole(
  roleId: string,
): roleId is CiAdministratorRole {
  return administratorRoleIds.has(roleId);
}

/** Returns whether a subject is Root or holds at least one administrator role. */
export function ciIsAdministratorUser(
  subject: Pick<
    CiAdministratorManagementSubject,
    "effectiveRoleIds" | "isRootUser"
  >,
): boolean {
  return (
    subject.isRootUser || subject.effectiveRoleIds.some(ciIsAdministratorRole)
  );
}

/**
 * Resolves a subject's highest administrator management-authority rank.
 * Unknown and assignment-only role IDs do not participate in the ranking.
 */
export function ciResolveAdministratorAuthorityRank(
  effectiveRoleIds: readonly string[],
): number | null {
  let highestRank: number | null = null;

  for (const roleId of effectiveRoleIds) {
    if (!ciIsAdministratorRole(roleId)) {
      continue;
    }

    const rank = CI_ADMINISTRATOR_AUTHORITY_RANKS[roleId];

    if (highestRank === null || rank > highestRank) {
      highestRank = rank;
    }
  }

  return highestRank;
}

/**
 * Determines whether an actor may manage an administrator target.
 *
 * Root may manage every non-Root administrator. A Root target may only edit
 * their own ordinary profile. Otherwise peers and higher-ranked admins may
 * manage the target; lower-ranked admins may not. The assignment-only system
 * super admin manager role grants an administrator the one exceptional upward
 * delegation to system super admins, but never grants access to Root.
 */
export function ciCanManageAdministrator({
  actor,
  target,
  operation,
}: CiCanManageAdministratorInput): boolean {
  if (!ciIsAdministratorUser(target)) {
    return false;
  }

  if (target.isRootUser) {
    return (
      operation === "profile-edit" && actor.isRootUser && actor.id === target.id
    );
  }

  if (actor.isRootUser) {
    return true;
  }

  const actorRank = ciResolveAdministratorAuthorityRank(actor.effectiveRoleIds);
  const targetRank = ciResolveAdministratorAuthorityRank(
    target.effectiveRoleIds,
  );

  if (actorRank === null || targetRank === null) {
    return false;
  }

  const targetIsSystemSuperAdmin =
    target.effectiveRoleIds.includes("system-super-admin");

  if (actor.canManageSystemSuperAdmins === true && targetIsSystemSuperAdmin) {
    return true;
  }

  return actorRank >= targetRank;
}
