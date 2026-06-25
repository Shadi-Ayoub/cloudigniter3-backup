/**
 * Normalizes base path to a leading-slash path without trailing slash.
 */
export function ciNormalizeBasePath(basePath: string): string {
  const normalized = `/${basePath}`.replace(/\/+/g, "/").replace(/\/$/, "");

  return normalized === "" ? "/" : normalized;
}
