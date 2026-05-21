import type { CiTenantResolutionSource, CiTenantScope, CiTenantStatus } from '../';

export type CiTenantResolutionResult = {
  id?: string;
  scope: CiTenantScope;
  source: CiTenantResolutionSource;
  status?: CiTenantStatus;

  /**
   * If present, middleware SHOULD rewrite the request pathname to this value.
   * This is only produced for subdomain mode when configured to rewrite.
   */
  rewritePathname?: string;

  /**
   * Optional: pathname without "/t/{tenant}" when slug routing is used.
   * Useful if you want to match protected/public routes on the "logical" path.
   */
  pathnameWithoutTenant?: string;
};
