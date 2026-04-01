import type { CiScopedSettingsScope } from '../../common/types/CiScopedSettingsScope';
import type { CiTargetTenantScope } from '../../common/types/CiTargetTenantScope';

/**
 * Input for direct record lookup.
 */
export type CiGetSettingsRecordInput = {
  settingsId: string;
  scope: CiScopedSettingsScope;
  targetTenantScope: CiTargetTenantScope;
  tenantId?: string;
  userId?: string;
};
