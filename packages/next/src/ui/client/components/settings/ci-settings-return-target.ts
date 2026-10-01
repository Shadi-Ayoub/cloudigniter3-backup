/** Only a different application path can be used as the preferences return target. */
export function ciSettingsReturnTarget(
  href: string,
  origin: string,
  currentPath: string,
): string {
  try {
    const url = new URL(href, origin);
    if (
      href.startsWith("/") &&
      !href.startsWith("//") &&
      url.origin === origin &&
      url.pathname !== currentPath
    )
      return url.pathname + url.search + url.hash;
  } catch {
    /* Invalid return targets use the dashboard. */
  }
  return "/dashboard";
}
