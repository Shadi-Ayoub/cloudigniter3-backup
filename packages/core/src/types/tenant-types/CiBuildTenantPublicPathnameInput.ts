import type { CiTenantContext } from "./CiTenantContext";

/** Input used to build a public pathname for a logical feature route. */
export interface CiBuildTenantPublicPathnameInput {
  /** Logical application pathname after Tenant transport segments are removed. */
  featurePathname: string;

  /** Canonical Tenant context resolved for the target navigation scope. */
  tenant: Pick<CiTenantContext, "mode" | "scope" | "slug">;

  /**
   * Slug-routing base path. Defaults to CloudIgniter's configured convention
   * of `/t`. Use an empty string for root-based Tenant paths.
   */
  tenantBasePath?: string;
}
