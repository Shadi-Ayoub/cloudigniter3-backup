import type { CiTenantScope } from "@/types";

export type CiDevBeaconTenantInfo = {
  /** CiTenant internal identifier (if available) */
  id?: string;
  /** Human-friendly slug used in routing */
  slug?: string;
  /** Display name (if resolved) */
  name?: string;
  /** Operational status (e.g., active/suspended) */
  status?: string;
  /** Optional categorization (e.g., TENANT/SETTING/etc.) */
  type?: string;
  /** Where it came from */
  source: "headers";
  /** CiTenant Scope: system/global/tenant */
  scope: CiTenantScope;
};
