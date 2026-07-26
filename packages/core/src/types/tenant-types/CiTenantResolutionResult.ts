import type { CiTenantResolutionSource } from "./CiTenantResolutionSource";
import type { CiTenantScope } from "./CiTenantScope";

/**
 * Result produced by low-level Tenant route resolution.
 *
 * Route resolution identifies the Tenant slug and feature pathname. Resolving
 * the internal Tenant identifier and lifecycle status is a separate lookup step.
 */
export type CiTenantResolutionResult = {
  /**
   * Route-safe Tenant slug extracted from the pathname or subdomain.
   */
  slug?: string;

  /**
   * Resolved Tenant scope.
   */
  scope: CiTenantScope;

  /**
   * Mechanism used to resolve the Tenant scope or slug.
   */
  source: CiTenantResolutionSource;

  /**
   * Logical feature pathname after removing Tenant routing segments.
   */
  featurePathname: string;

  /**
   * Internal pathname used when subdomain routing requires a rewrite.
   */
  rewritePathname?: string;
};
