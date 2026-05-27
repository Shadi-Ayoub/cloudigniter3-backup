import type { CiTenantStatus } from '../';
export type CiTenantSlugDdbTableItem = {
    PK: string;
    SK: string;
    type: 'TENANT_SLUG';
    slug: string;
    tenantId: string;
    /**
     * Minimal snapshot used by middleware lookups.
     * Enables single-read validation for existence + active/suspended.
     */
    status: CiTenantStatus;
    createdAt?: string;
    updatedAt?: string;
};
//# sourceMappingURL=CiTenantSlugDdbTableItem.d.ts.map