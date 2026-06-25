import type { CiTenantStatus } from "./CiTenantStatus";

export type CiTenantSlugDdbTableItem = {
  PK: string; // TENANT_SLUG
  SK: string; // TENANT_SLUG#<slug>
  type: "TENANT_SLUG";

  slug: string;
  tenantId: string;

  /**
   * Minimal snapshot used by middleware lookups.
   * Enables single-read validation for existence + active/suspended.
   */
  status: CiTenantStatus;

  createdAt?: string;
  updatedAt?: string;
};
