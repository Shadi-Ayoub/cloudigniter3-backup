import { ciBuildTableKey, ciBuildTableKeys } from "@cloudigniter/core/lib";
import type {
  CiResourceDeletionMetadata,
  CiTenantDdbTableItem,
  CiTenantHtmlTableRow,
} from "@cloudigniter/core/types";

export type CiStoredTenant = CiTenantDdbTableItem & {
  data?: {
    slug?: string;
    region?: string;
    usersCount?: number;
    isSystem?: boolean;
    tenantType?: string;
    meta?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export const CI_TENANT_COLLECTION_KEY = ciBuildTableKey("SYSTEM", "TENANTS");
export const CI_TENANT_ACTIVE_PREFIX = ciBuildTableKey("ACTIVE");
export const CI_TENANT_DELETED_PREFIX = ciBuildTableKey("DELETED");

export function ciBuildTenantPrimaryKey(tenantId: string) {
  return ciBuildTableKeys({
    partition: ["SYSTEM", "TENANT", tenantId],
    sort: ["META"],
  });
}

export function ciBuildTenantActiveSortKey(
  tenantId: string,
  createdAt: string,
): string {
  return ciBuildTableKey("ACTIVE", createdAt, "TENANT", tenantId);
}

export function ciBuildTenantDeletedSortKey(
  tenantId: string,
  deletedAt: string,
): string {
  return ciBuildTableKey("DELETED", deletedAt, "TENANT", tenantId);
}

export function ciBuildTenantSlugKeys(tenantId: string, slug: string) {
  return {
    GSI2PK: ciBuildTableKey("SYSTEM", "TENANT_SLUG", slug),
    GSI2SK: ciBuildTableKey("TENANT", tenantId),
  };
}

export function ciBuildTenantSeederPartitionKey(seederId: string): string {
  return ciBuildTableKey("DEVELOPER", "SEEDER", seederId);
}

export function ciBuildTenantSeedMarkerKeys(
  seederId: string,
  tenantId: string,
) {
  return ciBuildTableKeys({
    partition: ["DEVELOPER", "SEEDER", seederId],
    sort: ["RESOURCE", "TENANT", tenantId],
  });
}

export function ciTenantToTableRow(
  tenant: CiStoredTenant,
): CiTenantHtmlTableRow {
  return {
    tenantId: tenant.tenantId,
    name: tenant.name,
    slug: tenant.data?.slug ?? tenant.tenantId,
    status: tenant.status,
    type: tenant.data?.tenantType ?? "tenant",
    region: tenant.data?.region ?? "—",
    usersCount: tenant.data?.usersCount,
    isSystem: tenant.data?.isSystem,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
    statusTransition: tenant.statusTransition,
    deletionState: tenant.deletionState ?? "active",
    deletion: tenant.deletion as CiResourceDeletionMetadata | undefined,
  };
}

export function ciAssertTenantMutable(tenant: CiStoredTenant): void {
  if (tenant.data?.isSystem) {
    throw new Error(`System tenant "${tenant.tenantId}" cannot be deleted.`);
  }
}

export function ciAssertTenantOperationalStatusMutable(
  tenant: CiStoredTenant,
): void {
  if (tenant.data?.isSystem) {
    throw new Error(
      `System tenant "${tenant.tenantId}" cannot be suspended or activated.`,
    );
  }
  if (tenant.status === "archived") {
    throw new Error(
      `Archived tenant "${tenant.tenantId}" cannot be suspended or activated.`,
    );
  }
}

export function ciRequireLifecycleReason(reason: string): string {
  const value = reason.trim();
  if (value.length < 3) {
    throw new Error(
      "A deletion lifecycle reason of at least 3 characters is required.",
    );
  }
  return value;
}

export function ciRequireTenantStatusReason(reason: string): string {
  const value = reason.trim();
  if (value.length < 3) {
    throw new Error(
      "A tenant status-change reason of at least 3 characters is required.",
    );
  }
  return value;
}
