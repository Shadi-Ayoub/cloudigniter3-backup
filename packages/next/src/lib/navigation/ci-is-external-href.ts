/**
 * Determine whether a href should be treated as an external/native navigation.
 */
export function ciIsExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}
