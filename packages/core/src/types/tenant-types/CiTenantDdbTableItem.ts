import type {
  CiResourceDeletionMetadata,
  CiResourceDeletionState,
  CiSystemItemType,
  CiTenantStatus,
  CiTenantStatusTransitionMetadata,
} from "@ci-core/types";

export type CiTenantDdbTableItem = {
  PK: string; // "TENANT"
  SK: string; // "TENANT#<tenantId>"
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK?: string;
  GSI2SK?: string;

  id: string;
  type: CiSystemItemType;
  tenantId: string;

  /**
   * CiTenant lifecycle status used by middleware and authz gates.
   */
  status: CiTenantStatus;
  statusTransition?: CiTenantStatusTransitionMetadata;
  deletionState: CiResourceDeletionState;
  deletion?: CiResourceDeletionMetadata;

  name: string;
  description?: string;

  data?: {
    slug?: string;
    meta?: Record<string, unknown>;
    [key: string]: unknown;
  };

  createdAt: string;
  updatedAt: string;
  version: number;
};
