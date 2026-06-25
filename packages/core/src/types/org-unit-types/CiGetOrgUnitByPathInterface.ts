/**
 * Input for resolving an Org Unit by its canonical hierarchical path
 * within a Tenant.
 */
export interface CiGetOrgUnitByPathInterface {
  /**
   * Canonical Tenant identifier that owns the Org Unit.
   */
  tenantId: string;

  /**
   * Canonical hierarchical Org Unit path.
   *
   * Examples:
   * - "/hr"
   * - "/student-services"
   * - "/academic/grade-10/math"
   */
  orgUnitPath: string;
}
