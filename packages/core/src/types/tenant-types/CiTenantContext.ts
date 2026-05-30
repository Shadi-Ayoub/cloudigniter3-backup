import type { CiTenantRoutingMode } from "./CiTenantRoutingMode";
import type { CiTenantScope } from "./CiTenantScope";

export type CiTenantContext = {
  tenantId: string;
  tenantSlug?: string;
  tenantScope: CiTenantScope;
  tenantMode: CiTenantRoutingMode;
};
