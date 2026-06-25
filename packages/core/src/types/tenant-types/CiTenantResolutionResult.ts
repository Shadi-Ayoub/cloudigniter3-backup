import type { CiTenantResolutionSource } from "./CiTenantResolutionSource";
import type { CiTenantScope } from "./CiTenantScope";
import type { CiTenantStatus } from "./CiTenantStatus";

export type CiTenantResolutionResult = {
  id?: string;
  scope: CiTenantScope;
  source: CiTenantResolutionSource;
  status?: CiTenantStatus;

  /**
   * Internal pathname target produced by subdomain resolution when configured
   * to rewrite the request.
   */
  rewritePathname?: string;

  /**
   * Logical feature pathname after removing the configured slug-routing base
   * path and the Tenant or Global scope segment.
   *
   * Examples when tenantBasePath is "/tx":
   * - "/tx/acme/dashboard" -> "/dashboard"
   * - "/tx/global/dashboard" -> "/dashboard"
   */
  featurePathname?: string;
};
