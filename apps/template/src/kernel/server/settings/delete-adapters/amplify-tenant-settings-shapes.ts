import type { SettingsData } from '@CII/server/settings/types';

/**
 * Returned item shape for tenant-scoped settings models (PublicSetting/PrivateSetting).
 */
export type TenantSettingsItem = {
  tenantId: string;
  key: string;

  status?: string | null;
  version?: number | null;
  data: SettingsData;

  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TenantSettingsPrimaryKey = { tenantId: string; key: string };

export type TenantSettingsCreateInput = {
  tenantId: string;
  key: string;

  status?: string;
  version?: number;
  data: SettingsData;
};
