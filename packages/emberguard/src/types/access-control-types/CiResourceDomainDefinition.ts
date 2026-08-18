/** Administrative grouping for related application resources. */
export type CiResourceDomainStatus = "active" | "suspended";

/** Metadata for the latest deliberate resource-domain status transition. */
export type CiResourceDomainStatusChange = {
  changedAt: string;
  changedBy: string;
  reason: string;
};

/** Administrative grouping for related application resources. */
export type CiResourceDomainDefinition = {
  id: string;
  title: string;
  description?: string;
  /** Omitted catalogs remain backward compatible and are treated as active. */
  status?: CiResourceDomainStatus;
  /** Actor, timestamp, and required reason for the latest status transition. */
  statusChange?: CiResourceDomainStatusChange;
};
