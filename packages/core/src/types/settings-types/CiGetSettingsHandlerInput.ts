import type { CiSettingsRegistry } from "./index";

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
