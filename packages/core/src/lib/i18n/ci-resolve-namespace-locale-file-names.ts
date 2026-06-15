import { ciNamespaceSegmentToKebab } from "@ci-core/lib";

/**
 * Resolves the locale file names that should be loaded for a route namespace.
 *
 * The namespace follows dot-chain convention:
 *
 * dashboard.devTools.seeder
 *
 * This resolves to kebab-cased cumulative file names:
 *
 * [
 *   "dashboard",
 *   "dashboard-dev-tools",
 *   "dashboard-dev-tools-seeder"
 * ]
 *
 * Note:
 * - "common" is intentionally excluded because common.json is always loaded.
 * - The returned names can be used for both core locale files and custom locale files.
 */
export function ciResolveNamespaceLocaleFileNames(namespace: string): string[] {
  const parts = namespace
    .split(".")
    .map(ciNamespaceSegmentToKebab)
    .filter(Boolean);

  return parts.map((_, index) => parts.slice(0, index + 1).join("-"));
}
