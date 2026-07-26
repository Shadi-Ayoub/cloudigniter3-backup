import { NextResponse } from "next/server";

import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type { CiTenantContext } from "@cloudigniter/core/types";

type CiTenantRewriteRequest = Pick<Request, "url">;

/**
 * Rewrites a validated logical feature route to the internal Tenant or Global
 * application route while preserving forwarded request context headers.
 *
 * Examples:
 * - Tenant: /dashboard -> /ci-tenant/dashboard
 * - Global: /dashboard -> /ci-global/dashboard
 */
export function ciRewriteTenantRoute({
  request,
  requestHeaders,
  tenant,
  featurePathname,
}: {
  request: CiTenantRewriteRequest;
  requestHeaders: Headers;
  tenant: CiTenantContext;
  featurePathname: string;
}): NextResponse {
  const routePathname = ciNormalizePathname(featurePathname);

  if (tenant.scope === "system") {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const internalRoot = tenant.scope === "global" ? "/ci-global" : "/ci-tenant";

  const rewriteUrl = new URL(request.url);

  rewriteUrl.pathname = routePathname === "/" ? internalRoot : `${internalRoot}${routePathname}`;

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}
