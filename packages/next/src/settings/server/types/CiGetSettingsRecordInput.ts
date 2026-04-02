import type { CiScopedSettingsScope } from "../../common/types/CiScopedSettingsScope";
import type { CiTargetTenantScope } from "../../common/types/CiTargetTenantScope";

/**
 * Input used to read one persisted settings record.
 */
export type CiGetSettingsRecordInput = {
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
};
