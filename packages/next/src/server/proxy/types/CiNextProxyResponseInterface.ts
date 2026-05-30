import type { NextRequest } from "next/server";
import type {
  CiTenantRoutingOptions,
  CiRoute,
  CiRouteRuntimeConfig,
} from "@cloudigniter/core/types";

export interface CiNextProxyResponseInterface {
  request: NextRequest;
  routeConfig: CiRouteRuntimeConfig;
  tenantRoutingConfig: CiTenantRoutingOptions;
  routes: Record<string, CiRoute>;
}
