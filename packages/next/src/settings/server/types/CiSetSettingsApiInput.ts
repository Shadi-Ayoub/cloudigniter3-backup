import type { CiScopedSettingsScope } from "../../common/types/CiScopedSettingsScope";
import type { CiSettings } from "../../common/types/CiSettings";
import type { CiTargetTenantScope } from "../../common/types/CiTargetTenantScope";

/**
 * Input used by the server-facing `ciSetSettings` helper.
 */
export type CiSetSettingsApiInput<TSettings extends CiSettings = CiSettings> = {
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

  /**
   * Partial override payload.
   */
  value: Partial<TSettings>;
};
