import { ciBuildTableKey, ciBuildTableKeys } from "@cloudigniter/core/lib";
import type {
  CiOrgUnitContext,
  CiOrgUnitDdbTableItem,
  CiOrgUnitManagementRow,
} from "@cloudigniter/core/types";

export type CiStoredOrgUnit = CiOrgUnitDdbTableItem;

export type CiStoredOrgUnitAttachment = {
  PK: string;
  SK: string;
  id: string;
  type: "ORG_UNIT_ATTACHMENT";
  tenantId: string;
  status: CiStoredOrgUnit["status"];
  name: string;
  description?: string;
  data: {
    orgUnitId: string;
    parentId: string | null;
    ancestorOrgUnitIds: string[];
    slug: string;
    path: string;
  };
  createdAt: string;
  updatedAt: string;
  version: number;
};

export const CI_ORG_UNIT_COLLECTION_KEY = ciBuildTableKey(
  "SYSTEM",
  "ORG_UNITS",
);

export function ciBuildOrgUnitPrimaryKey(orgUnitId: string) {
  return ciBuildTableKeys({
    partition: ["SYSTEM", "ORG_UNIT", orgUnitId],
    sort: ["META"],
  });
}

export function ciBuildOrgUnitCollectionSortKey(
  path: string,
  orgUnitId: string,
) {
  return ciBuildTableKey("ORG_UNIT", path, orgUnitId);
}

export function ciBuildOrgUnitChildrenPartitionKey(parentId: string | null) {
  return ciBuildTableKey("SYSTEM", "ORG_UNIT_CHILDREN", parentId ?? "ROOT");
}

export function ciBuildOrgUnitTenantAttachmentKeys(
  tenantId: string,
  path: string,
) {
  return ciBuildTableKeys({
    partition: ["SYSTEM", "TENANT", tenantId, "ORG_UNITS"],
    sort: ["PATH", path],
  });
}

export function ciBuildOrgUnitSeedMarkerKeys(
  seederId: string,
  orgUnitId: string,
) {
  return ciBuildTableKeys({
    partition: ["DEVELOPER", "SEEDER", seederId],
    sort: ["RESOURCE", "ORG_UNIT", orgUnitId],
  });
}

export function ciOrgUnitToManagementRow(
  orgUnit: CiStoredOrgUnit,
): CiOrgUnitManagementRow {
  return {
    orgUnitId: orgUnit.id,
    parentId: orgUnit.data.parentId,
    ancestorOrgUnitIds: [...orgUnit.data.ancestorOrgUnitIds],
    name: orgUnit.name,
    slug: orgUnit.data.slug,
    path: orgUnit.data.path,
    description: orgUnit.description,
    status: orgUnit.status,
    tenantIds: [...orgUnit.data.tenantIds],
    childIds: [...(orgUnit.data.childIds ?? [])],
    createdAt: orgUnit.createdAt,
    updatedAt: orgUnit.updatedAt,
    version: orgUnit.version,
  };
}

export function ciOrgUnitAttachmentToContext(
  attachment: CiStoredOrgUnitAttachment,
): CiOrgUnitContext {
  return {
    id: attachment.data.orgUnitId,
    tenantId: attachment.tenantId,
    parentId: attachment.data.parentId,
    ancestorOrgUnitIds: attachment.data.ancestorOrgUnitIds,
    slug: attachment.data.slug,
    name: attachment.name,
    path: attachment.data.path,
    status: attachment.status,
  };
}

export function ciBuildStoredOrgUnitAttachment(
  orgUnit: CiStoredOrgUnit,
  tenantId: string,
): CiStoredOrgUnitAttachment {
  return {
    ...ciBuildOrgUnitTenantAttachmentKeys(tenantId, orgUnit.data.path),
    id: `${tenantId}:${orgUnit.id}`,
    type: "ORG_UNIT_ATTACHMENT",
    tenantId,
    status: orgUnit.status,
    name: orgUnit.name,
    ...(orgUnit.description ? { description: orgUnit.description } : {}),
    data: {
      orgUnitId: orgUnit.id,
      parentId: orgUnit.data.parentId,
      ancestorOrgUnitIds: [...orgUnit.data.ancestorOrgUnitIds],
      slug: orgUnit.data.slug,
      path: orgUnit.data.path,
    },
    createdAt: orgUnit.createdAt,
    updatedAt: orgUnit.updatedAt,
    version: orgUnit.version,
  };
}

export function ciRequireOrgUnitText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.includes("#")) throw new Error(`${label} cannot contain '#'.`);
  return normalized;
}

export function ciRequireOrgUnitSlug(value: string): string {
  const slug = value.trim();
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Org Unit slugs must use lowercase kebab case.");
  }
  return slug;
}

export function ciRequireOrgUnitTenantIds(values: readonly string[]): string[] {
  const tenantIds = [...new Set(values.map((value) => value.trim()))].filter(
    Boolean,
  );
  if (tenantIds.length === 0) {
    throw new Error("An Org Unit must be attached to at least one tenant.");
  }
  if (tenantIds.length > 30) {
    throw new Error("An Org Unit can be attached to at most 30 tenants.");
  }
  tenantIds.forEach((tenantId) => ciRequireOrgUnitText(tenantId, "Tenant ID"));
  return tenantIds.sort();
}
