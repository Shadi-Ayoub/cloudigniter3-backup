import type {
  CiResourceDeletionMetadata,
  CiResourceDeletionState,
} from "../resource-lifecycle-types";
import type { CiTenantStatus } from "./CiTenantStatus";
import type { CiTenantStatusTransitionMetadata } from "./CiTenantLifecycleTypes";

export type CiTenantHtmlTableRow = {
  /**
   * Stable unique identifier
   */
  tenantId: string;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * URL-safe identifier
   */
  slug: string;

  /**
   * Operational state of the tenant
   */
  status: CiTenantStatus;
  statusTransition?: CiTenantStatusTransitionMetadata;

  /**
   * Business / organizational classification
   */
  type: string;

  /**
   * Region or jurisdiction
   */
  region: string;

  usersCount?: number;
  createdAt: string;
  updatedAt?: string;
  deletionState?: CiResourceDeletionState;
  deletion?: CiResourceDeletionMetadata;

  /**
   * Flags for system-level tenants
   */
  isSystem?: boolean;
};
