import type { CiTableKeySegments } from "../../types/table-types";

/** Prefix shared by every CloudIgniter-owned table and secondary-index key. */
export const CI_TABLE_KEY_PREFIX = "CI" as const;

/** Delimiter between structural and identity segments in CloudIgniter table keys. */
export const CI_TABLE_KEY_DELIMITER = "#" as const;

function assertValidSegment(segment: string, index: number): void {
  if (typeof segment !== "string" || segment.length === 0) {
    throw new TypeError(`CloudIgniter table key segment ${index} must be a non-empty string.`);
  }
  if (segment.trim() !== segment) {
    throw new TypeError(
      `CloudIgniter table key segment ${index} must not have surrounding whitespace.`,
    );
  }
  if (segment.includes(CI_TABLE_KEY_DELIMITER)) {
    throw new TypeError(
      `CloudIgniter table key segment ${index} must not contain "${CI_TABLE_KEY_DELIMITER}".`,
    );
  }
}

/**
 * Builds one canonical CloudIgniter table key.
 *
 * Structural segments are supplied by callers in uppercase snake case. Opaque
 * identifiers are preserved exactly so the helper never changes domain IDs.
 */
export function ciBuildTableKey(...segments: CiTableKeySegments): string {
  if (segments.length === 0) {
    throw new TypeError("A CloudIgniter table key requires at least one segment.");
  }
  segments.forEach(assertValidSegment);
  return [CI_TABLE_KEY_PREFIX, ...segments].join(CI_TABLE_KEY_DELIMITER);
}
