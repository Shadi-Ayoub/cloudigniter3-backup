import type { CiScopedSettingsScope } from "./CiScopedSettingsScope";
import type { CiTenantScope } from "@/types";

/**
 * Input used to build canonical settings record keys.
 */
export type CiBuildSettingsKeysInput = {
  settingsId: string;
  scope?: CiScopedSettingsScope;

  /**
   * Explicit tenant identifier (used when tenantScope = 'tenant')
   */
  tenantId?: string;

  /**
   * When true, forces tenantScope = 'global'
   */
  targetTenantScope?: CiTenantScope;

  /**
   * Required when scope = 'user'
   */
  userId?: string;
};
