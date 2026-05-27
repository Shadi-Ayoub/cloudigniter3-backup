/**
 * CiCallOptions
 *
 * Optional fetch controls and request customization.
 * First-class scenario: pass correlation/trace headers for end-to-end diagnostics.
 */
export type CiCallOptions = {
  /**
   * HTTP method override.
   * Defaults to 'POST' (to preserve current behavior).
   */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

  /**
   * Additional headers merged with the default headers.
   * Example: { 'x-ci-correlation-id': crypto.randomUUID() }
   */
  headers?: Record<string, string>;

  /**
   * Abort controller support for long-running calls.
   */
  signal?: AbortSignal;

  /**
   * Common fetch options used with Next.js route handlers.
   */
  cache?: RequestCache;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  redirect?: RequestRedirect;
  referrerPolicy?: ReferrerPolicy;
};
