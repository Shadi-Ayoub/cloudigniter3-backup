import type { NextRequest } from "next/server";

import type {
  CiRoute,
  CiRouteRuntimeConfig,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import { ciNextProxyResponse } from "@cloudigniter/next/server/proxy";

import { appGetServerAllConfig } from "@/kernel/server";

export async function proxy(request: NextRequest) {
  const conf = await appGetServerAllConfig();

  const tenantRoutingConfig = conf.tenant as CiTenantRoutingOptions;
  const routeConfig = conf.route as CiRouteRuntimeConfig;
  const routes = conf.routes as Record<string, CiRoute>;

  return ciNextProxyResponse({
    request,
    routeConfig,
    tenantRoutingConfig,
    routes,
  });
}

export const config = {
  matcher: [
    "/((?!api|ci-internal|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w-]+).*)",
  ],
};
