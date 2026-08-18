import type { CiAuthorizationCombiningAlgorithm } from "../access-control-types/CiAuthorizationCombiningAlgorithm";

/** Application-level configuration for EmberGuard access-control evaluation. */
export type CiEmberguardAccessControlConfig = {
  /**
   * Selects how matching allow and deny privileges are combined.
   * Defaults to `deny-overrides` when omitted.
   */
  combiningAlgorithm?: CiAuthorizationCombiningAlgorithm;
};
