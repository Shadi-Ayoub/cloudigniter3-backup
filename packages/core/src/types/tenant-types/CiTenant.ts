import type { CiTenantDdbTableItem } from "./CiTenantDdbTableItem";
import type { CiTenantMode } from "./CiTenantMode";
import type { CiTenantScope } from "./CiTenantScope";
import type { CiTenantStatus } from "./CiTenantStatus";
import type { CiTenantStatusTransitionMetadata } from "./CiTenantLifecycleTypes";
import type {
  CiResourceDeletionMetadata,
  CiResourceDeletionState,
} from "../resource-lifecycle-types";

/**
 * High-level CiTenant type used across CloudIgniter.
 */
export type CiTenant = {
  /**
   * CiTenant internal identifier (if available)
   * same as tenantId and the suffix in SK
   */
  id?: string;

  /** Human-friendly slug used in routing, URL, labels, etc. */
  slug?: string;

  /** Display name (if resolved) */
  name?: string;

  description?: string;

  /** Operational status (e.g., active/suspended) */
  status?: CiTenantStatus;
  statusTransition?: CiTenantStatusTransitionMetadata;
  deletionState?: CiResourceDeletionState;
  deletion?: CiResourceDeletionMetadata;

  /** Optional categorization (e.g., TENANT/SETTING/etc.) */
  type?: string;

  /** Where it came from */
  source: "headers";

  /** CiTenant Scope: system/global/tenant */
  scope: CiTenantScope;

  mode?: CiTenantMode;
  /**
   * Canonical resolved Org Unit path, when the route is Org Unit-scoped.
   *
   * Example:
   * "/academic/grade-10/math"
   */
  orgUnitPath?: string;

  /**
   * Final logical feature pathname after Tenant and Org Unit resolution.
   *
   * Example:
   * "/dashboard"
   */
  featurePathname?: string;

  /**
   * Request headers forwarded by proxy/middleware that use the CloudIgniter
   * or application namespaces.
   *
   * Only headers beginning with "x-ci-" or "x-app-" are included.
   */
  forwardedHeaders?: Record<string, string>;

  /**
   * Request cookies available to the Server Component that use the
   * CloudIgniter or application namespaces.
   *
   * Only cookie names beginning with "ci-" or "app-" are included.
   */
  forwardedCookies?: Record<string, string>;

  /**
   * Arbitrary tenant metadata (config, tags, etc.)
   */
  meta?: Record<string, unknown>;

  createdAt?: string;
  updatedAt?: string;

  raw?: CiTenantDdbTableItem;
};
