/** Canonical CloudIgniter roles that participate in administrator authority. */
export type CiAdministratorRole =
  "admin" | "super-admin" | "system-admin" | "system-super-admin";

/**
 * Administrator operations whose Root-user protection differs.
 *
 * `profile-edit` is limited to ordinary owner-controlled profile data.
 * `account-management` covers privileged changes such as roles, assignments,
 * suspension, deletion, and impersonation.
 */
export type CiAdministratorManagementOperation =
  "profile-edit" | "account-management";

/** Provider-neutral identity data required by administrator policy checks. */
export type CiAdministratorManagementSubject = {
  /** Stable application identity used to enforce Root-user ownership. */
  id: string;
  /** Identity roles and currently effective assignment role IDs. */
  effectiveRoleIds: readonly string[];
  /** Durable projection of membership in the reserved Root identity group. */
  isRootUser: boolean;
  /**
   * Whether an active, system-scoped assignment delegates management of system
   * super admins. Identity-provider roles must never set this capability.
   */
  canManageSystemSuperAdmins?: boolean;
};

/** Input for an administrator target-management decision. */
export type CiCanManageAdministratorInput = {
  actor: CiAdministratorManagementSubject;
  target: CiAdministratorManagementSubject;
  operation: CiAdministratorManagementOperation;
};
