import type { CiSettingsRegistry } from '../';

export type CiGetSettingsHandlerInput = {
  registry: CiSettingsRegistry;

  tenantId?: string;
  userId?: string;
  pathname?: string;

  publicSettingIds?: string[];
  privateSettingIds?: string[];
  userSettingIds?: string[];
  routeSettingIds?: string[];
};
