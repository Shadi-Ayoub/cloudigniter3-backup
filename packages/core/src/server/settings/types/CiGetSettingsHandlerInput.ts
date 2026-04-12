import {
  type CiSettingsContext,
  type CiSettingsScope,
} from "@cloudigniter/core";

/**
 * Input accepted by the get-settings handler.
 */
export type CiGetSettingsHandlerInput = {
  /**
   * Registered settings identifier.
   */
  settingsId: string;

  /**
   * Requested settings scope.
   */
  scope: CiSettingsScope;

  /**
   * Optional resolution context.
   */
  context?: CiSettingsContext;
};
