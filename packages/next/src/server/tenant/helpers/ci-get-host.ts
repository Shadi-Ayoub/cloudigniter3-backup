type CiRequestWithHost = Pick<Request, "headers" | "url">;

/**
 * Resolves the request host safely from forwarded headers or the request URL.
 */
export function ciGetHost(request: CiRequestWithHost): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host =
    forwardedHost ?? request.headers.get("host") ?? new URL(request.url).host;

  return host.split(",")[0]?.trim().toLowerCase() ?? "";
}
