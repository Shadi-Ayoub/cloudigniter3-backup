import type { CiAuthorizationCombiningAlgorithm } from "./CiAuthorizationCombiningAlgorithm";

/** Runtime behavior for the provider-neutral authorizer. */
export type CiAuthorizerOptions = {
  /** Defaults to the safer `deny-overrides` strategy. */
  combiningAlgorithm?: CiAuthorizationCombiningAlgorithm;

  /** Injectable clock for deterministic tests and non-standard runtimes. */
  clock?: () => Date;

  /** Validate the complete catalog when creating an authorizer. Defaults to true. */
  validateDefinition?: boolean;
};
