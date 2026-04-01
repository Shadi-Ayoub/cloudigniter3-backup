import type { CiScopedSettingsScope } from '../../common/types/CiScopedSettingsScope';
import type { CiSettings } from '../../common/types/CiSettings';
import type { CiTargetTenantScope } from '../../common/types/CiTargetTenantScope';

/**
 * Input for persisted record writes.
 */
export type CiSetSettingsInput<TSettings extends CiSettings = CiSettings> = {
  settingsId: string;
  scope: CiScopedSettingsScope;
  targetTenantScope: CiTargetTenantScope;
  tenantId?: string;
  userId?: string;
  value: Partial<TSettings>;
};
