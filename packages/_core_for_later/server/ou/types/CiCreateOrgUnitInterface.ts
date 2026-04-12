export interface CiCreateOrgUnitInterface {
  tenantId: string;
  /** Parent path or null if this is a root OU under the tenant. */
  parentPath: string | null; // null for root OU under tenant
  /** Segment for this OU (already normalized, e.g. "campus:abu-dhabi"). */
  segmentKey: string; // last segment, e.g. "campus:abu-dhabi"
  name: string;
  description?: string;
  category?: string;
  code?: string;
  meta?: Record<string, unknown>;
}
