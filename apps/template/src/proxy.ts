import type { NextRequest } from "next/server";
import type {
  CiCoreConfig,
  CiRoute,
  CiRouteRuntimeConfig,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";
// import type { CiAwsProviderConfig } from "@cloudigniter/aws/types";
// import type { CiNextConfig } from "@cloudigniter/next/types";
import { appGetServerAllConfig } from "@/kernel/server";

// import ciConfig from "../cloudigniter.config";

import {
  // ciNextProxyMatcher,
  ciNextProxyResponse,
} from "@cloudigniter/next/server/proxy";

// const conf = ciConfig as CiCoreConfig & CiAwsProviderConfig & CiNextConfig;

// const ciConf = ciConfig as CiConfig;

export async function proxy(request: NextRequest) {
  const conf = await appGetServerAllConfig();

  const tenantRoutingConfig = conf.tenant as CiTenantRoutingOptions;
  const routeConfig = conf.route as CiRouteRuntimeConfig;
  const routes = conf.routes as Record<string, CiRoute>;

  const res = await ciNextProxyResponse({
    request,
    routeConfig,
    tenantRoutingConfig,
    routes,
  });

  return res;
}

export const config = {
  matcher: [
    "/((?!api|ci-internal|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w-]+).*)",
  ],
};
