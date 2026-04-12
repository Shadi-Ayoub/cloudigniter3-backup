import { ciGetRoutes } from '@cloudigniter/next/utility';

import { customRoutes } from '@/custom/routes';

export function getRoutes() {
  const routes = ciGetRoutes(customRoutes);

  return routes;
}
