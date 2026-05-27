import type { CiSystemItemType, CiTenantStatus } from "@ci-core/types";
export type CiTenantDdbTableItem = {
    PK: string;
    SK: string;
    id: string;
    type: CiSystemItemType;
    tenantId: string;
    /**
     * CiTenant lifecycle status used by middleware and authz gates.
     */
    status: CiTenantStatus;
    name: string;
    description?: string;
    data?: {
        slug?: string;
        meta?: Record<string, unknown>;
        [key: string]: unknown;
    };
    createdAt: string;
    updatedAt: string;
};
//# sourceMappingURL=CiTenantDdbTableItem.d.ts.map