import type { CiTenantStatus } from "./CiTenantStatus";

export type CiTenantLookupBySlugOkBody = {
  exists: true;
  slug: string;
  tenantId: string;
  status: CiTenantStatus;
  updatedAt?: string;
};
