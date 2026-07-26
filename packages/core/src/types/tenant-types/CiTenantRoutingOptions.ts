import type { CiOrgUnitRoutingOptions } from "@ci-core/types";
import type { CiTenantInfoPageStrategy } from "./CiTenantInfoPageStrategy";
import type { CiTenantMode } from "./CiTenantMode";

/**
 * Tenant routing configuration.
 */
export type CiTenantRoutingOptions = {
  /** Enables multi-tenant routing. */
  enabled?: boolean;

  /** Routing mode: "slug" or "subdomain". */
  mode?: CiTenantMode;

  /** Base path for slug routing, for example "/t". */
  basePath?: string;

  /** Header names used by middleware and server components. */
  // idHeaderName?: string;
  // modeHeaderName?: string;
  // scopeHeaderName?: string;
  // statusHeaderName?: string;
  /**
   * Header name used to forward the final resolved application feature pathname.
   *
   * Example:
   * "/t/acme/academic/grade-10/math/dashboard" -> "/dashboard"
   */
  // featurePathnameHeaderName?: string;

  /** Cookie names used by middleware and server components. */
  // idCookieName?: string;
  // modeCookieName?: string;
  // scopeCookieName?: string;
  // statusCookieName?: string;
  // featurePathnameCookieName?: string;

  /** Persist resolved tenant in cookies. */
  // writeTenantCookie?: boolean;

  /** If true, rewrite foo.example.com internally when using subdomain mode. */
  rewriteSubdomainToTenantPath?: boolean;

  /** Domains considered root when using subdomains. */
  rootDomains?: string[];

  /** Reserved subdomains that must never be treated as tenants. */
  reservedSubdomains?: string[];

  /** Slugs that are not valid tenant identifiers. */
  reservedTenantSlugs?: string[];

  /**
   * Internal lookup endpoint used by middleware to validate tenant existence/status.
   * MUST be excluded from middleware matching.
   */
  lookupPath?: string;

  /** If true, middleware validates tenant existence and status. */
  validateTenant?: boolean;

  /** Route shown when tenant does not exist. */
  notFoundPath?: string;

  /** Route shown when tenant exists but is suspended. */
  suspendedPath?: string;

  /**
   * How middleware sends the user to info pages.
   *
   * - "rewrite": keep original URL.
   * - "redirect": change URL in browser.
   */
  infoPageStrategy?: CiTenantInfoPageStrategy;

  /** Org Unit routing configuration. */
  orgUnit?: CiOrgUnitRoutingOptions;
};
