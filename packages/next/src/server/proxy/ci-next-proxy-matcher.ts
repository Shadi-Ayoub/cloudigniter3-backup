// Exclude common non-app paths right at the router edge
// Process everything *except* api, _next internals, and files-with-extensions
// IMPORTANT: exclude /ci-internal/* from proxy matching to prevent recursion
export const ciNextProxyMatcher =
  "/((?!api|ci-internal|_next/static|_next/image|_next/webpack-hmr|favicon.ico|robots.txt|sitemap.xml|.*\\.[\\w-]+).*)";
