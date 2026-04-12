export interface CiUpdateOrgUnitInterface {
  tenantId: string;
  /** Existing OU path (immutable). */
  path: string; // full OU path (= key)
  name?: string;
  description?: string;
  category?: string;
  code?: string;
  meta?: Record<string, unknown>;
}
