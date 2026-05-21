/**
 * Extracts the raw `Host` header value from an incoming CiRequest.
 *
 * Purpose:
 * - Provides a centralized, framework-agnostic way to access the HTTP Host header.
 * - Typically used in multi-tenant or domain-aware routing logic where
 *   subdomain or base-domain extraction is required.
 *
 * Behavior:
 * - Returns the value of the `host` header exactly as received.
 * - If the header is missing, returns an empty string (`''`) instead of `null`
 *   to simplify downstream string operations.
 *
 * Important Notes:
 * - The returned value may include a port number (e.g., "example.com:3000").
 * - The value is not normalized (no lowercase conversion, no port stripping).
 * - Consumers are responsible for:
 *   - Removing the port (if required),
 *   - Lowercasing for stable comparisons,
 *   - Validating against allowed base domains.
 *
 * Example:
 *    For: https://schoola.example.com:3000/dashboard?page=1#section
 *    url (request.url): https://schoola.example.com:3000/dashboard?page=1#section
 *    Scheme (request.nextUrl.protocol): https
 *    Host (= Hostname + Port) (request.nextUrl.hostname): schoola.example.com
 *    Port (request.nextUrl.port): 3000
 *    Origin (= protocol + host + port) (request.nextUrl.origin):
 *    Path (request.nextUrl.pathname): /dashboard
 *    Query (request.nextUrl.search): page=1
 *    Fragment (Hash) (Not available in middleware): section
 *
 * In a Multi-CiTenant CloudIgniter Context:
 *      [Protocol] → Transport Layer
 *      [Host]     → CiTenant / Environment Layer
 *      [Path]     → Application Route Layer
 *      [Query]    → CiRequest State Layer
 *      [Fragment] → Client Navigation Layer
 *
 * Example:
 *   const host = getHost(request);
 *   // "schoola.example.com:443"
 *
 *   // Further normalization (if needed):
 *   const hostname = host.split(':')[0].toLowerCase();
 *
 * @param request - Standard Fetch API CiRequest object (e.g., Next.js proxy CiRequest).
 * @returns The raw Host header string, or an empty string if not present.
 */
export function ciGetHost(request: Request) {
  return request.headers.get("host") ?? "";
}
