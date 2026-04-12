import type {
  CiScopedSettingsScope,
  CiSettings,
  CiTargetTenantScope,
} from "@cloudigniter/core";

/**
 * Input accepted by the set-settings handler.
 */
export type CiSetSettingsHandlerInput<
  TSettings extends CiSettings = CiSettings,
> = {
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

  /**
   * Partial override value to persist.
   */
  value: Partial<TSettings>;
};
