import type { CiTenantRoutingOptions } from "@ci-core/types";

export type CiLookupOrgUnitInput = {
  tenantId: string;
  orgUnitPath: string;
  orgUnitRoutingConfig: Required<
    NonNullable<CiTenantRoutingOptions["orgUnit"]>
  >;
};
