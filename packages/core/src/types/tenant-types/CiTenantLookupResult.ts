import type { CiTenantStatus } from "./CiTenantStatus";
/**
 * Successful Tenant lookup result.
 */
export interface CiTenantLookupSuccess {
  exists: true;
  id: string;
  slug: string;
  name?: string;
  type?: string;
  status: CiTenantStatus;
}

/**
 * Tenant lookup result returned when no matching Tenant exists.
 */
export interface CiTenantLookupFailure {
  exists: false;
}

/**
 * Result returned by the Tenant lookup endpoint.
 */
export type CiTenantLookupResult = CiTenantLookupSuccess | CiTenantLookupFailure;
