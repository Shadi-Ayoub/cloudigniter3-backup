import type { CiTenantMode } from "./CiTenantMode";

export type CiTenantResolutionOptions = {
  /**
   * Enable or disable tenant routing globally.
   */
  enabled: boolean;

  /**
   * Configured tenant routing mode.
   */
  tenantRoutingMode: CiTenantMode;

  /**
   * Base pathname used for slug-based tenant routing.
   *
   * Examples:
   * - "/tx" -> "/tx/acme/dashboard"
   * - "/t"  -> "/t/acme/dashboard"
   * - ""    -> "/acme/dashboard"
   *
   * This is required. Resolution must not fall back to a hard-coded base path.
   */
  tenantBasePath: string;

  /**
   * Base domains used to validate subdomain-based tenant resolution.
   *
   * Example:
   * ["example.com", "example.ae"]
   */
  baseDomain?: string[];

  /**
   * Header key used for internal or previous-pass tenant propagation.
   *
   * Example:
   * "x-ci-tenant"
   */
  // tenantHeaderKey: string;

  /**
   * Header name used to propagate the resolved Tenant scope.
   */
  // scopeHeaderName: string;

  /**
   * Optional fallback Tenant when none is resolved.
   *
   * Use with care. Protected routes will normally reject or redirect
   * unresolved Tenant requests instead.
   */
  fallbackTenantId?: string;

  /**
   * Whether subdomain-based tenant requests should be internally rewritten.
   */
  rewriteSubdomainToTenantPath: boolean;
};
