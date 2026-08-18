import type { CiRoutesMap } from "@ci-core/types";
import { ciCoreRoutes } from "./ci-core-routes";
import { ciMergeRouteMaps } from "./ci-merge-route-maps";

export function ciGetRoutes(customRoutes: CiRoutesMap) {
  return ciMergeRouteMaps(ciCoreRoutes, customRoutes);
}
