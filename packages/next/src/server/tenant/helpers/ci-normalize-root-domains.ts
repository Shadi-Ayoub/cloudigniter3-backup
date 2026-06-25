import { ciStripPort } from "./ci-strip-port";

/**
 * Normalizes configured root domains.
 *
 * Accepts values such as:
 * - example.com
 * - https://example.com
 * - http://localhost:3000/
 */
export function ciNormalizeRootDomains(domains: string[]): string[] {
  return domains
    .map((domain) => {
      try {
        return ciStripPort(new URL(domain).host);
      } catch {
        return ciStripPort(
          domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        );
      }
    })
    .filter(Boolean);
}
