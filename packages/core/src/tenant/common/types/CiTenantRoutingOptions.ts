import type { CiTenantRoutingMode, CiTenantUrlStrategy } from '../';

export interface CiTenantRoutingOptions {
  enabled?: boolean;
  mode?: CiTenantRoutingMode;
  basePath?: string;

  idHeaderName?: string;
  modeHeaderName?: string;
  scopeHeaderName?: string;
  statusHeaderName?: string;

  idCookieName?: string;
  modeCookieName?: string;
  scopeCookieName?: string;
  statusCookieName?: string;

  writeTenantCookie?: boolean;
  rewriteSubdomainToTenantPath?: boolean;

  rootDomains?: string[];
  reservedSubdomains?: string[];
  reservedTenantSlugs?: string[];

  /**
   * Internal lookup endpoint used by middleware to validate tenant existence/status.
   * This endpoint MUST be excluded from middleware matching to avoid recursion.
   *
   * Example: '/ci-internal/tenant-lookup'
   */
  lookupPath?: string;

  /**
   * If true, middleware will validate tenant against the lookup endpoint
   * and redirect/rewrite on not-found/suspended.
   */
  validateTenant?: boolean;

  /**
   * Route to show when tenant does not exist.
   */
  notFoundPath?: string;

  /**
   * Route to show when tenant is suspended.
   */
  suspendedPath?: string;

  /**
   * How to send the user to an info page from middleware.
   * - rewrite: keeps the original URL in the browser
   * - redirect: changes the URL to the info page
   */
  infoPageStrategy?: CiTenantUrlStrategy;
}
