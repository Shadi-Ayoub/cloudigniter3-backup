import type { CiScopedSettingsScope } from '../../common/types/CiScopedSettingsScope';
import type { CiTargetTenantScope } from '../../common/types/CiTargetTenantScope';

/**
 * Input used to build low-level settings keys.
 */
export type CiBuildSettingsKeysInput = {
  settingsId: string;
  scope: CiScopedSettingsScope;
  targetTenantScope: CiTargetTenantScope;
  tenantId?: string;
  userId?: string;
};
