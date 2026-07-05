/**
 * Reads diagnostic headers forwarded by proxy/middleware.
 *
 * Only CloudIgniter and application-scoped headers are exposed to the
 * Dev Beacon. Cookies and unrelated request headers are intentionally omitted.
 */
export function ciReadForwardedHeaders(
  requestHeaders: Headers,
): Record<string, string> {
  const forwardedHeaders: Record<string, string> = {};

  requestHeaders.forEach((value, name) => {
    const normalizedName = name.toLowerCase();

    if (
      normalizedName.startsWith("x-ci-") ||
      normalizedName.startsWith("x-app-")
    ) {
      forwardedHeaders[normalizedName] = value;
    }
  });

  return Object.fromEntries(
    Object.entries(forwardedHeaders).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}
