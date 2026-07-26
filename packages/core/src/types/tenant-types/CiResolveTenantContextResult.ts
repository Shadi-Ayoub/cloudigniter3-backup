import type { CiTenantContext } from "./CiTenantContext";

/**
 * Result returned after resolving and optionally validating the Tenant context.
 */
export interface CiResolveTenantContextResult {
  /**
   * Canonical Tenant context for the current request.
   */
  tenant: CiTenantContext;

  /**
   * Logical application pathname after removing the external Tenant or Global
   * routing prefix.
   */
  featurePathname: string;

  /**
   * Optional internal rewrite pathname produced by Tenant resolution.
   */
  rewritePathname?: string;
}
