import type { NextRequest } from "next/server";

/**
 * Resolves the request host safely from forwarded headers or the request URL.
 */
export function ciGetHost(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host =
    forwardedHost ?? request.headers.get("host") ?? request.nextUrl.host;

  return host.split(",")[0]?.trim().toLowerCase() ?? "";
}
