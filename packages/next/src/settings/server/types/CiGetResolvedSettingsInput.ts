import type { CiCanOverrideSettingsValue } from "../../common/types/CiCanOverrideSettingsValue";
import type { CiSettingsContext } from "../../common/types/CiSettingsContext";
import type { CiSettingsRegistry } from "../../common/types/CiSettingsRegistry";
import type { CiSettingsScope } from "../../common/types/CiSettingsScope";

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
