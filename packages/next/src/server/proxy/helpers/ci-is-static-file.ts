/**
 * STATIC_EXT
 * -----------------------------------------------------------------------------
 * Matches requests targeting static assets by file extension.
 *
 * Purpose
 * - Prevents proxy / tenant resolution / auth logic from executing for
 *   non-HTML resources.
 * - Avoids unnecessary compute, header mutations, and false tenant detection.
 *
 * Behavior
 * - Case-insensitive (`/image.PNG` → match)
 * - Anchored to end of pathname to avoid partial matches
 * - Covers typical web bundles, media, fonts, and document artifacts
 *
 * Examples (match → treated as static)
 *   /logo.svg
 *   /_next/static/chunk.js
 *   /fonts/inter.woff2
 *   /video.mp4
 *
 * Examples (no match → treated as route)
 *   /dashboard
 *   /t/global/settings
 *   /api/users
 *
 * Important
 * - Assumes query string is already removed.
 * - Should be evaluated against a normalized pathname only.
 */
export const STATIC_EXT =
  /\.(?:js|mjs|cjs|css|map|png|jpg|jpeg|gif|svg|ico|webp|avif|mp4|webm|mp3|wav|ogg|pdf|txt|xml|json|woff2?|ttf|otf)$/i;

/**
 * Determines whether a normalized pathname represents a static asset.
 *
 * Why this exists
 * - Proxy layers often need a fast escape hatch for static files to avoid
 *   polluting responses with routing / tenant / security logic.
 *
 * Input Contract
 * - Expects a pathname that is already normalized:
 *     - leading slash preserved
 *     - no trailing query string
 *     - no hash fragment
 *
 * Returns
 * - true  → request should bypass dynamic routing logic
 * - false → request is considered an application route
 */
export function ciIsStaticFile(pathnameNormalized: string) {
  return STATIC_EXT.test(pathnameNormalized);
}
