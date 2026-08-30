/** Default time that a newly created resource is highlighted in the UI. */
export const CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS = 5 * 60 * 1000;

export type CiNewResourceTimestamp = string | number | Date | null | undefined;

/**
 * Returns whether a resource creation timestamp is inside the configured
 * recency window. Pass `now` from the caller when deterministic rendering or
 * testing is required.
 */
export function ciIsNewResource(
  createdAt: CiNewResourceTimestamp,
  options: {
    now?: number;
    durationMs?: number;
  } = {},
): boolean {
  if (createdAt === null || createdAt === undefined) return false;

  const durationMs =
    options.durationMs ?? CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return false;

  const createdAtMs =
    createdAt instanceof Date
      ? createdAt.getTime()
      : new Date(createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return false;

  const now = options.now ?? Date.now();
  const ageMs = now - createdAtMs;
  return ageMs >= 0 && ageMs < durationMs;
}
