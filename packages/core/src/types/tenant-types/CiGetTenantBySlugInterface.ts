/**
 * Input for resolving a Tenant by its route-safe slug.
 */
export interface CiGetTenantBySlugInterface {
  /**
   * Canonical Tenant slug extracted from slug-based or subdomain routing.
   *
   * Example: "acme"
   */
  slug: string;
}
