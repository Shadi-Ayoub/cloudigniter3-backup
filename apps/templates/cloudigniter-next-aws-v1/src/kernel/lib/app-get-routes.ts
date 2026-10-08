import { ciGetRoutes } from "@cloudigniter/core/lib";

import { customRoutes } from "@/custom/routes";

export function appGetRoutes() {
  const routes = ciGetRoutes(customRoutes);

  return routes;
}
