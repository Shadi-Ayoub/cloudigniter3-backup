import type { CiRoute } from "@ci-core/types";
import { ciIsRouteSearchParams } from "./ci-is-route-search-params";
import { ciIsRecord } from "./ci-is-record";

export function ciIsRoute(value: unknown): value is CiRoute {
  if (!ciIsRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.namespace === "string" &&
    typeof value.protected === "boolean" &&
    typeof value.pathname === "string" &&
    typeof value.publicPathname === "string" &&
    typeof value.matchedPattern === "string" &&
    (value.matchKind === "exact" || value.matchKind === "wildcard") &&
    (value.wildcardPath === null || typeof value.wildcardPath === "string") &&
    typeof value.search === "string" &&
    typeof value.requestTarget === "string" &&
    ciIsRouteSearchParams(value.searchParams)
  );
}
