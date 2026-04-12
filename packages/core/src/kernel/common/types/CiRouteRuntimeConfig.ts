import type { CiInfoPageStrategy } from "../../../";

/**
 * Runtime config used by route and middleware helpers.
 */
export type CiRouteRuntimeConfig = {
  /**
   * Cookie name used to persist the resolved route namespace.
   */
  namespaceCookieName: string;

  /**
   * Header name used to expose the resolved route namespace.
   */
  namespaceHeaderName: string;

  /**
   * Optional cookie name used to persist the resolved pathname.
   */
  pathnameCookieName?: string;

  /**
   * Optional header name used to expose the resolved pathname.
   */
  pathnameHeaderName?: string;

  /**
   * Controls how info pages are resolved/rendered for route handling.
   */
  infoPageStrategy?: CiInfoPageStrategy;
};
