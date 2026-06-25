import type { CiOrgUnitStatus } from "./CiOrgUnitStatus";

/**
 * Represents an organizational unit inside a tenant.
 *
 * Examples:
 * - HR
 * - Student Services
 * - Academic Affairs
 * - Grade 10
 * - Math Department
 */
export type CiOrgUnitContext = {
  /** Stable Org Unit identifier. */
  id: string;

  /** Parent tenant identifier. */
  tenantId: string;

  /** Parent Org Unit identifier for tree structures. */
  parentId?: string | null;

  /** Route-safe Org Unit slug. */
  slug: string;

  /**
   * Optional display metadata available when context originates from lookup.
   */
  name?: string;

  /**
   * Hierarchical Org Unit path.
   *
   * Examples:
   * - "/hr"
   * - "/student-services"
   * - "/academic/grade-10/math"
   */
  path: string;

  /** Current operational status. */
  status: CiOrgUnitStatus;
};
