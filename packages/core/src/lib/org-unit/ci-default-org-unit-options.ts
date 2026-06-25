import type { CiOrgUnitRoutingOptions } from "@ci-core/types";

/**
 * Default Org Unit routing options.
 */
export const CI_DEFAULT_ORG_UNIT_OPTIONS: Required<CiOrgUnitRoutingOptions> = {
  /**
   * Org Units are disabled by default to preserve backward compatibility.
   */
  enabled: false,

  // Headers

  idHeaderName: "x-ci-org-unit-id",

  slugHeaderName: "x-ci-org-unit-slug",

  pathHeaderName: "x-ci-org-unit-path",

  statusHeaderName: "x-ci-org-unit-status",

  // Cookies

  idCookieName: "ci-org-unit-id",

  slugCookieName: "ci-org-unit-slug",

  pathCookieName: "ci-org-unit-path",

  statusCookieName: "ci-org-unit-status",

  /**
   * Persist resolved Org Unit context in cookies.
   */
  writeOrgUnitCookie: true,

  /**
   * Internal middleware validation endpoint.
   */
  lookupPath: "/ci-internal/org-unit-lookup",

  suspendedPath: "/org-unit/suspended",

  maxDepth: 5,

  enforceStatus: true,
};
