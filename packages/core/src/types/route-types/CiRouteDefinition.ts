import type { CiAccessRequirement } from "../auth-types";
import type { CiTenantScope } from "../tenant-types/CiTenantScope";

/** Declarative route metadata used by route resolution and enforcement layers. */
export interface CiRouteDefinition {
  title: string;
  namespace: string;
  protected: boolean;

  /**
   * Tenant scopes in which this logical route is available.
   *
   * Omitting this field preserves the legacy behavior and makes the route
   * available in every Tenant scope. An empty list makes the route unavailable
   * in every scope.
   */
  tenantScopes?: readonly CiTenantScope[];

  /**
   * Optional resource/action requirement for an authorization middleware.
   *
   * The route is an enforcement point; the referenced resource remains part
   * of the independent access-control catalog.
   */
  access?: CiAccessRequirement;
}
