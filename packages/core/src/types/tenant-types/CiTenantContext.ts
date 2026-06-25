import type { CiTenantStatus } from "./CiTenantStatus";
import type { CiTenantMode } from "./CiTenantMode";
import type { CiTenantScope } from "./CiTenantScope";

/**
 * Canonical tenant context used everywhere after proxy resolution.
 */
export interface CiTenantContext {
  /**
   * Tenant identifier.
   * Only populated when scope is "tenant".
   */
  id?: string;

  /**
   * Current request tenant scope.
   */
  scope: CiTenantScope;

  /**
   * Effective tenant routing mode used for this request.
   */
  mode: CiTenantMode;

  /**
   * Tenant lifecycle status.
   * Defaults to "active" unless validation says otherwise.
   */
  status: CiTenantStatus;

  /**
   * Whether the tenant exists.
   * System/global scopes should usually be true.
   */
  exists: boolean;

  /**
   * Original normalized request pathname.
   */
  pathname: string;
}
