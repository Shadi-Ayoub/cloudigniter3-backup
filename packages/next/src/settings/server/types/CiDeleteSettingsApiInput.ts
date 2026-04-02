import type { CiScopedSettingsScope } from "../../common/types/CiScopedSettingsScope";
import type { CiTargetTenantScope } from "../../common/types/CiTargetTenantScope";

/**
 * Input used by the server-facing `ciDeleteSettings` helper.
 */
export type CiDeleteSettingsApiInput = {
  /**
   * Registered settings identifier.
   */
  settingsId: string;

  /**
   * Persistence-supported scope.
   */
  scope: CiScopedSettingsScope;

  /**
   * Ownership boundary.
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
