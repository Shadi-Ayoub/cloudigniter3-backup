import type { CiOrgUnitContext, CiRoute, CiTenantContext } from "@ci-core/types";

export interface CiRequestContext {
  schemaVersion: 1;
  tenant: CiTenantContext;
  orgUnit: CiOrgUnitContext | null;
  featurePathname: string | null;
  route: CiRoute | null;
}
