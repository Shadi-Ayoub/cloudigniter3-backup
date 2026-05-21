import { NextResponse, type NextRequest } from "next/server";
import type {
  CiTenantRoutingOptions,
  CiTenantScope,
} from "@cloudigniter/core/types";

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
 * 1) Clones the incoming Next.js URL to preserve origin / protocol.
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
 *   The active NextRequest from middleware execution.
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
 * Returns
 * -------
 * NextResponse
 *   Either a rewrite or redirect response depending on configuration.
 *
 * Notes
 * -----
 * - This helper NEVER mutates the original request object.
 * - Headers from an existing response are preserved when supplied.
 * - The function intentionally avoids assumptions about tenant validity;
 *   callers are responsible for resolution logic.
 */
export function ciRewriteToTenantInfoPage(
  request: NextRequest,
  pathname: string,
  tenant: string,
  scope: CiTenantScope,
  opts: Required<CiTenantRoutingOptions>,
  response?: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;

  // Clear any existing query string to keep info pages canonical
  url.search = "";
  url.searchParams.set("tenant", tenant);
  url.searchParams.set("scope", scope);

  const r = response ?? NextResponse.next();

  const strategy = opts.infoPageStrategy ?? "rewrite";

  return strategy === "redirect"
    ? NextResponse.redirect(url, { headers: r.headers })
    : NextResponse.rewrite(url, { headers: r.headers });
}
