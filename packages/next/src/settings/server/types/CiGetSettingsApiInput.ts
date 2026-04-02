import type { CiSettingsContext } from "../../common/types/CiSettingsContext";
import type { CiSettingsRegistry } from "../../common/types/CiSettingsRegistry";
import type { CiSettingsScope } from "../../common/types/CiSettingsScope";

/**
 * Input used by the server-facing `ciGetSettings` helper.
 */
export type CiGetSettingsApiInput = {
  /**
   * Settings registry.
   */
  registry: CiSettingsRegistry;

  /**
   * Registered settings identifier.
   */
  settingsId: string;

  /**
   * Requested settings scope.
   */
  scope: CiSettingsScope;

  /**
   * Resolution context.
   */
  context?: CiSettingsContext;
};
