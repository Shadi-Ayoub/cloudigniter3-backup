import { NextResponse } from "next/server";

import type {
  CiTenantRoutingOptions,
  CiTenantScope,
} from "@cloudigniter/core/types";

type CiTenantInfoPageRequest = Pick<Request, "url">;

/**
 * Rewrites or redirects the request to a tenant-aware informational page.
 *
 * Purpose
 * -------
 * Centralizes navigation to system / tenant informational endpoints such as:
 *
 *   - CiTenant not found
 *   - Access denied
 *   - Invalid scope
 *   - Maintenance / suspended tenant
 *
 * Instead of duplicating URL manipulation logic inside middleware branches,
 * this helper constructs a canonical destination URL and applies the configured
 * navigation strategy.
 *
 * Behavior
 * --------
 * 1) Clones the incoming request URL to preserve origin / protocol.
 * 2) Replaces the pathname with the provided informational route.
 * 3) Clears existing query parameters to prevent polluted URLs.
 * 4) Injects canonical context parameters:
 *
 *      ?tenant=<tenantId>&scope=<scope>
 *
 * 5) Applies the strategy defined in CiTenantRoutingOptions:
 *
 *      - "rewrite"  → Transparent internal rewrite (default)
 *      - "redirect" → Client-visible navigation
 *
 * Canonicalization Rationale
 * --------------------------
 * Informational pages must be deterministic and cache-safe. Carrying forward
 * arbitrary query strings from the original request can:
 *
 *   - Break caching layers
 *   - Produce duplicate URLs
 *   - Leak unrelated state into error pages
 *
 * Therefore all prior query parameters are intentionally removed.
 *
 * Parameters
 * ----------
 * request:
 *   The active request from middleware execution.
 *
 * pathname:
 *   Destination informational route (absolute pathname).
 *   Example: "/info/tenant-not-found"
 *
 * tenant:
 *   Resolved tenant identifier used by the informational page.
 *
 * scope:
 *   CiTenant scope associated with the resolution result.
 *   Typical values: "system" | "global" | "tenant"
 *
 * opts:
 *   Fully-resolved CiTenantRoutingOptions controlling navigation behavior.
 *
 * response (optional):
 *   Existing NextResponse whose headers should be preserved. This allows
 *   middleware pipelines to retain cookies, tracing headers, etc.
 *
 * requestHeaders (optional):
 *   Request headers forwarded to the rewritten informational destination.
 *   This makes the resolved Tenant and Org Unit context available to Server
 *   Components during the same request cycle.
 *
 * Returns
 * -------
 * NextResponse
 *   Either a rewrite or redirect response depending on configuration.
 *
 * Notes
 * -----
 * - This helper NEVER mutates the original request object.
 * - Headers from an existing response are preserved when supplied.
 * - Forwarded request headers apply only to rewrites. Redirects initiate a new
 *   browser request and therefore cannot preserve middleware request overrides.
 * - The function intentionally avoids assumptions about tenant validity;
 *   callers are responsible for resolution logic.
 */
export function ciRewriteToTenantInfoPage(
  request: CiTenantInfoPageRequest,
  pathname: string,
  tenant: string,
  scope: CiTenantScope,
  opts: Required<CiTenantRoutingOptions>,
  response?: NextResponse,
  requestHeaders?: Headers,
): NextResponse {
  const url = new URL(request.url);

  url.pathname = pathname;

  // Clear any existing query string to keep info pages canonical
  url.search = "";
  url.searchParams.set("tenant", tenant);
  url.searchParams.set("scope", scope);

  const responseToPreserve = response ?? NextResponse.next();

  const strategy = opts.infoPageStrategy ?? "rewrite";

  if (strategy === "redirect") {
    return NextResponse.redirect(url, {
      headers: responseToPreserve.headers,
    });
  }

  return NextResponse.rewrite(url, {
    headers: responseToPreserve.headers,

    ...(requestHeaders
      ? {
          request: {
            headers: requestHeaders,
          },
        }
      : {}),
  });
}
