import type { CiTenantScope } from "@cloudigniter/core/types";
/**
 * Normalizes unknown scope values into a safe tenant scope.
 */
export function ciNormalizeTenantScope(
  value: string | null | undefined,
): CiTenantScope {
  if (value === "tenant") return "tenant";
  if (value === "global") return "global";
  return "system";
}
