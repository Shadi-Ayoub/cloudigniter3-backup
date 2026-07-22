import type { CiTenantMode, CiTenantScope } from "@ci-core/types";

export type CiTenantSummary = {
  /** CiTenant internal identifier (if available) */
  id?: string;
  /** Human-friendly slug used in routing */
  slug?: string;
  /** Display name (if resolved) */
  name?: string;
  /** Operational status (e.g., active/suspended) */
  status?: string;
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
};
