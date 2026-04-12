import type { CiScopedSettingsScope, CiTargetTenantScope } from "../../../";

/**
 * Input used to build deterministic settings storage keys.
 */
export type CiBuildSettingsKeysInput = {
  /**
   * Registered settings identifier.
   */
  settingsId: string;

  /**
   * Persistence-supported scope.
   */
  scope: CiScopedSettingsScope;

  /**
   * Ownership boundary for the stored record.
   */
  targetTenantScope: CiTargetTenantScope;

  /**
   * Optional tenant identifier when the target scope is `tenant`.
   */
  tenantId?: string;

  /**
   * Optional user identifier. Required for `user` scope.
   */
  userId?: string;
};
