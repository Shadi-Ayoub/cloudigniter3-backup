import { deepmerge } from "deepmerge-ts";
import type { CiRoutesMap } from "@/types";
import { ciCoreRoutes } from "./ci-core-routes";

export function ciGetRoutes(customRoutes: CiRoutesMap) {
  const routes = deepmerge(ciCoreRoutes, customRoutes);

  return routes;
}
