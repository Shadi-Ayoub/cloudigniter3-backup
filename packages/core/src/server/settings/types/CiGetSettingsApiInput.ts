import type {
  CiSettingsContext,
  CiSettingsRegistry,
  CiSettingsScope,
} from "@cloudigniter/core";

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
