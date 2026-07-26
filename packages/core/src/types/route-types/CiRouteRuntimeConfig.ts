import type { CiInfoPageStrategy } from "@ci-core/types";

/**
 * Runtime config used by route and middleware helpers.
 */
export interface CiRouteRuntimeConfig {
  /**
   * Controls how info pages are resolved/rendered for route handling.
   */

  /**
   * Internal page used to explain rejected or unregistered routes.
   */
  infoPagePath?: string;

  infoPageStrategy?: CiInfoPageStrategy;
}
