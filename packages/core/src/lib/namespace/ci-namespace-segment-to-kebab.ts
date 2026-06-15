/**
 * Converts one namespace segment into a kebab-case locale file segment.
 *
 * Examples:
 * - "devTools" -> "dev-tools"
 * - "DevTools" -> "dev-tools"
 * - "dev-tools" -> "dev-tools"
 */
export function ciNamespaceSegmentToKebab(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}
