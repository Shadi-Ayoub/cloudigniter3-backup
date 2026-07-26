import { type NextRequest, NextResponse } from "next/server";
import type { CiRoutesMap } from "@cloudigniter/core/types";
import { ciNextProxyResponse } from "@cloudigniter/next/server/proxy";
import { appGetCoreConfig } from "@/kernel/server";

/**
 * Runs the CloudIgniter application proxy for requests matched by the
 * exported proxy configuration.
 *
 * Runtime configuration is resolved before delegating Tenant, Org Unit,
 * logical-route, authentication, and internal-rewrite handling to
 * ciNextProxyResponse().
 */
export async function proxy(request: NextRequest) {
  const config = appGetCoreConfig();
  const routes = config.routes as CiRoutesMap;

  const response = await ciNextProxyResponse({
    request,
    config,
    routes,
  });

  return response;
}

/**
 * Limits proxy execution to application routes.
 *
 * Static assets, internal framework resources, API routes, and CloudIgniter
 * internal endpoints bypass the application proxy.
 */
export const config = {
  matcher: [
    "/((?!api|ci-internal|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w-]+).*)",
  ],
};
