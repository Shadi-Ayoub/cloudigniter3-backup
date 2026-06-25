/**
 * Removes port number from host.
 */
export function ciStripPort(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}
