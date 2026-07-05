import type { CiTenantScope } from "@ci-core/types";

/**
 * Normalizes the tenant scope received from forwarded request headers.
 *
 * Falls back to system scope when the header is absent or invalid.
 */
export function ciNormalizeTenantScope(value: string | null): CiTenantScope {
  switch (value) {
    case "global":
    case "tenant":
      return value;

    case "system":
    default:
      return "system";
  }
}
