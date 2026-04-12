import type {
  CiScopedSettingsScope,
  CiSettings,
  CiTargetTenantScope,
} from "../../../";

/**
 * Input used to persist one settings override record.
 */
export type CiSetSettingsInput<TSettings extends CiSettings = CiSettings> = {
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
   * Optional user identifier for `user` scope.
   */
  userId?: string;

  /**
   * Partial override value to persist.
   */
  value: Partial<TSettings>;
};
