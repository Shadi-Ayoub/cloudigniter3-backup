import type { CiRouteDefinition } from "./CiRouteDefinition";
import type { CiRoutesMap } from "./CiRoutesMap";
import type { CiRouteMatchKind } from "./CiRouteMatchKind";
import type { CiRoutePattern } from "./CiRoutePattern";
import type { CiRouteSearchParams } from "./CiRouteSearchParams";

/**
 * Fully resolved route information for the current request.
 */
export interface CiRoute extends CiRouteDefinition {
  /**
   * Normalized logical/feature pathname used for route matching.
   *
   * Example:
   * "/dashboard/users/123"
   */
  pathname: string;

  /**
   * Original public pathname received by Next.js.
   *
   * This can include tenant transport segments.
   *
   * Example:
   * "/tx/acme/dashboard/users/123"
   */
  publicPathname: string;

  /**
   * Registered route pattern that matched the logical pathname.
   *
   * Example:
   * "/dashboard/users/*"
   */
  matchedPattern: CiRoutePattern;

  matchKind: CiRouteMatchKind;

  wildcardPath: string | null;

  /**
   * Query string including the leading "?".
   */
  search: string;

  /**
   * Public pathname and query string.
   */
  requestTarget: string;

  searchParams: CiRouteSearchParams;

  routesDefinitions: CiRoutesMap;
}
