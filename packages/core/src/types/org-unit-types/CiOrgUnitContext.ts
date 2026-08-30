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

  /**
   * Authoritatively resolved predecessors ordered from the tree root to the
   * direct parent. Authorization uses these IDs for descendant propagation;
   * callers must never derive them from an untrusted pathname.
   */
  ancestorOrgUnitIds?: readonly string[];

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
