import type {
  CiPurgeResourceInput,
  CiResourceDeletionState,
  CiRestoreResourceInput,
  CiSoftDeleteResourceInput,
} from "../resource-lifecycle-types";
import type { CiTenantHtmlTableRow } from "./CiTenantHtmlTableRow";

export type CiListTenantsInput = {
  deletionState?: CiResourceDeletionState;
  limit?: number;
  nextToken?: string;
};

export type CiListTenantsResult = {
  items: CiTenantHtmlTableRow[];
  count: number;
  nextToken?: string;
};

export type CiDeleteTenantInput = Omit<
  CiSoftDeleteResourceInput,
  "resourceId"
> & {
  tenantId: string;
};

export type CiRestoreTenantInput = Omit<
  CiRestoreResourceInput,
  "resourceId"
> & {
  tenantId: string;
};

export type CiPurgeTenantInput = Omit<
  CiPurgeResourceInput,
  "resourceId" | "confirmation"
> & {
  tenantId: string;
  confirmation: string;
};

export type CiTenantStatusTransitionMetadata = {
  status: "active" | "suspended";
  changedAt: string;
  changedBy: string;
  reason: string;
};

export type CiSetTenantStatusInput = {
  tenantId: string;
  status: "active" | "suspended";
  reason: string;
};

export type CiTenantLifecycleResult = {
  tenant: CiTenantHtmlTableRow;
};
