import type { CiSettingsScope } from "./index";
import type { CiSettingsDefaults } from "./CiSettingsDefaults";
import type { CiSettingsMeta } from "./CiSettingsMeta";

/**
 * Definition for a single settings domain.
 */
export type CiSettingsDefinition = {
  /**
   * The scope for this settings domain.
   */
  scope: CiSettingsScope;

  /**
   * Default values for this settings domain.
   */
  defaults?: CiSettingsDefaults;

  /**
   * Optional metadata for docs/UI.
   */
  meta?: CiSettingsMeta;
};
