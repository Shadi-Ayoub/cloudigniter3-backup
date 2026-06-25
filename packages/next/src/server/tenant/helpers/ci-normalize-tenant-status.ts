import type { CiTenantStatus } from "@cloudigniter/core/types";

/**
 * Normalizes unknown status values into a safe tenant status.
 */
export function ciNormalizeTenantStatus(
  value: string | null | undefined,
): CiTenantStatus {
  if (value === "suspended") return "suspended";
  if (value === "archived") return "archived";
  return "active";
}
