import type {
  CiScopedSettingsScope,
  CiTargetTenantScope,
} from "@cloudigniter/core";

/**
 * Input accepted by the delete-settings handler.
 */
export type CiDeleteSettingsHandlerInput = {
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
   * Optional tenant identifier.
   */
  tenantId?: string;

  /**
   * Optional user identifier.
   */
  userId?: string;
};
