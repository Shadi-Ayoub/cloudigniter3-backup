/**
 * Org Unit-related tenant routing configuration.
 */
export type CiOrgUnitRoutingOptions = {
  /** Enable Org Unit resolution under tenants. */
  enabled?: boolean;

  /**
   * Internal lookup endpoint used by middleware to validate Org Unit existence/status.
   * MUST be excluded from middleware matching.
   */
  lookupPath?: string;

  /**
   * Whether middleware blocks access to resolved suspended or archived Org Units.
   *
   * Org Unit lookup still occurs regardless of this option because implicit
   * longest-prefix pathname resolution requires existence information.
   */
  enforceStatus?: boolean;

  /**
   * Route shown when a resolved Org Unit is suspended or archived.
   */
  suspendedPath?: string;

  /**
   * Maximum number of URL segments middleware should try to resolve
   * as an Org Unit path.
   *
   * Example:
   * "/academic/grade-10/math" = 3 segments.
   */
  maxDepth?: number;
};
