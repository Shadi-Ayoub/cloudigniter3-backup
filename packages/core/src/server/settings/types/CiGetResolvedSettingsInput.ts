import type {
  CiCanOverrideSettingsValue,
  CiSettingsContext,
  CiSettingsRegistry,
  CiSettingsScope,
} from "../../../";

/**
 * Input used to resolve the final merged settings value.
 */
export type CiGetResolvedSettingsInput = {
  /**
   * Settings registry containing the target definition.
   */
  registry: CiSettingsRegistry;

  /**
   * Registered settings identifier.
   */
  settingsId: string;

  /**
   * Domain scope requested by the caller.
   */
  scope: CiSettingsScope;

  /**
   * Request-time resolution context.
   */
  context?: CiSettingsContext;

  /**
   * Optional override control policy.
   */
  canOverride?: CiCanOverrideSettingsValue;
};
