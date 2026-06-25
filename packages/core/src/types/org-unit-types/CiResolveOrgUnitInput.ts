import type { CiOrgUnitContext } from "./CiOrgUnitContext";

export type CiResolveOrgUnitInput = {
  tenantId: string;
  featurePathname: string;
  maxDepth: number;

  /**
   * Lightweight lookup callback used internally by the resolver.
   * The resolver should not know about request/config details.
   */
  lookupOrgUnit: (
    tenantId: string,
    orgUnitPath: string,
  ) => Promise<CiOrgUnitContext | null>;
};
