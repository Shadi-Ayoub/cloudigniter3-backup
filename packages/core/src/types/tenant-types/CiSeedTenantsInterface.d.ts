import type { CiSeedTenantItem } from "./CiSeedTenantItem";
export interface CiSeedTenantsInterface {
    tenants: CiSeedTenantItem[];
    /**
     * Optional seed set identifier used in marker SKs.
     * Example: "demo-iattec-2026", "baseline-v1", "sandbox-tenants"
     */
    seedSetId?: string;
    /**
     * Optional marker writer identity.
     */
    seededBy?: string;
}
//# sourceMappingURL=CiSeedTenantsInterface.d.ts.map