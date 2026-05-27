import type { CiTenantRoutingMode, CiTenantScope } from "./";
export type CiTenantContext = {
    tenantId: string;
    tenantSlug?: string;
    tenantScope: CiTenantScope;
    tenantMode: CiTenantRoutingMode;
};
//# sourceMappingURL=CiTenantContext.d.ts.map