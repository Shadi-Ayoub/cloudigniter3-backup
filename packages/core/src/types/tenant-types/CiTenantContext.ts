import type { CiTenantMode } from "./CiTenantMode";
import type { CiTenantResolutionSource } from "./CiTenantResolutionSource";
import type { CiTenantScope } from "./CiTenantScope";
import type { CiTenantStatus } from "./CiTenantStatus";

/**
 * Canonical Tenant context produced by proxy resolution.
 */
export interface CiTenantContext {
  /**
   * Internal Tenant identifier.
   *
   * This may differ from the route-safe Tenant slug.
   * Only populated when the Tenant was resolved through a lookup.
   */
  id?: string;

  /**
   * Canonical route-safe Tenant slug.
   *
   * Example:
   * "acme"
   */
  slug?: string;

  /**
   * Tenant display name.
   */
  name?: string;

  /**
   * Tenant classification or category.
   */
  type?: string;

  /**
   * Current request Tenant scope.
   */
  scope: CiTenantScope;

  /**
   * Effective Tenant routing mode used for this request.
   */
  mode: CiTenantMode;

  /**
   * Tenant lifecycle status.
   */
  status: CiTenantStatus;

  /**
   * Whether the resolved Tenant exists.
   *
   * System and Global scopes should normally use `true`.
   */
  exists: boolean;

  /**
   * Original normalized public request pathname.
   */
  pathname: string;

  /**
   * Original mechanism through which the Tenant was resolved.
   *
   * This describes Tenant resolution, not how the serialized request context
   * was later transported to the application.
   */
  source: CiTenantResolutionSource;
}
