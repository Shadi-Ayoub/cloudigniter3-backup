/**
 * Represents pathname information after CloudIgniter resolves routing context.
 */
export type CiResolvedPathnameContext = {
  /** Original incoming pathname. */
  original: string;

  /**
   * Feature pathname after removing tenant and Org Unit route segments.
   *
   * Example:
   * "/t/acme/hr/dashboard" becomes "/dashboard".
   */
  feature: string;

  /**
   * Internal rewritten pathname.
   *
   * Example:
   * "/ci-tenant/dashboard".
   */
  rewrite: string;
};
