import type { CiOrgUnitStatus } from "./CiOrgUnitStatus";

export type CiOrgUnitManagementRow = {
  orgUnitId: string;
  parentId: string | null;
  ancestorOrgUnitIds: string[];
  name: string;
  slug: string;
  path: string;
  description?: string;
  status: CiOrgUnitStatus;
  tenantIds: string[];
  childIds: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type CiListOrgUnitsInput = {
  limit?: number;
  nextToken?: string;
};

export type CiListOrgUnitsResult = {
  items: CiOrgUnitManagementRow[];
  count: number;
  nextToken?: string;
};

export type CiCreateOrgUnitInput = {
  orgUnitId: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string;
  status?: CiOrgUnitStatus;
  tenantIds: string[];
  meta?: Record<string, unknown>;
};

/** Slug stays immutable; parentId requests an atomic subtree move when supplied. */
export type CiUpdateOrgUnitInput = {
  orgUnitId: string;
  parentId?: string | null;
  name: string;
  description?: string;
  status: CiOrgUnitStatus;
  tenantIds: string[];
  expectedVersion: number;
};

export type CiOrgUnitMutationResult = {
  orgUnit: CiOrgUnitManagementRow;
};

export type CiOrgUnitSeederDataItem = CiCreateOrgUnitInput;
