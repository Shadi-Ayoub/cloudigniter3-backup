import type { CiScopedSettingsScope } from './CiScopedSettingsScope';
import type { CiSettings } from './CiSettings';
import type { CiTargetTenantScope } from './CiTargetTenantScope';

/**
 * Persisted settings record.
 */
export type CiSettingsRecord<TSettings extends CiSettings = CiSettings> = {
  settingsId: string;
  scope: CiScopedSettingsScope;
  targetTenantScope: CiTargetTenantScope;
  tenantId?: string;
  userId?: string;
  value: Partial<TSettings>;
  createdAt?: string;
  updatedAt?: string;
};
