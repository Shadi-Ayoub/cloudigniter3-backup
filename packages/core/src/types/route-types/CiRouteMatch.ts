import type { CiRouteDefinition } from "./CiRouteDefinition";
import type { CiRouteMatchKind } from "./CiRouteMatchKind";
import type { CiRoutePattern } from "./CiRoutePattern";

export interface CiRouteMatch {
  definition: CiRouteDefinition;

  /**
   * The key from CiRoutesMap that matched the pathname.
   *
   * Example:
   * "/dashboard/users/*"
   */
  matchedPattern: CiRoutePattern;

  matchKind: CiRouteMatchKind;

  /**
   * The portion captured by the trailing wildcard.
   *
   * Example:
   * pathname:      "/dashboard/users/123/edit"
   * pattern:       "/dashboard/users/*"
   * wildcardPath:  "123/edit"
   *
   * Null for an exact match.
   */
  wildcardPath: string | null;
}
