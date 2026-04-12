export interface CiOrgUnitData {
  /** Full path including all ancestors, e.g. "tenant:ats/campus:abu-dhabi/grade:10/section:A" */
  path: string;
  /** Parent path, or null for root OU of that tenant. */
  parentPath: string | null;
  /** Owning tenant. */
  // tenantId: string;
  /** Optional free-form category ("campus", "grade", "department", etc.) */
  category?: string;
  /** Optional short code for UI. */
  code?: string;
  /** Arbitrary metadata for app-specific needs. */
  meta?: Record<string, unknown>;

  [key: string]: unknown;
}
