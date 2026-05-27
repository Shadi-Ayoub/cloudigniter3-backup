import type { CiTenantRoutingMode, CiTenantScope, CiTenantUrlStrategy } from "@ci-core/types";
export declare const CI_DEFAULT_TENANT_ID_HEADER_NAME: string;
export declare const CI_DEFAULT_TENANT_SCOPE_HEADER_NAME: string;
export declare const CI_DEFAULT_TENANT_MODE_HEADER_NAME: string;
export declare const CI_DEFAULT_TENANT_STATUS_HEADER_NAME: string;
export declare const CI_DEFAULT_TENANT_ID_COOKIE_NAME: string;
export declare const CI_DEFAULT_TENANT_SCOPE_COOKIE_NAME: string;
export declare const CI_DEFAULT_TENANT_MODE_COOKIE_NAME: string;
export declare const CI_DEFAULT_TENANT_STATUS_COOKIE_NAME: string;
export declare const CI_DEFAULT_TENANT_HEADERS: {
    readonly tenantMode: string;
    readonly tenantScope: string;
    readonly tenantId: string;
    readonly tenantStatus: string;
};
export declare const CI_DEFAULT_TENANT_COOKIES: {
    readonly tenantMode: string;
    readonly tenantScope: string;
    readonly tenantId: string;
    readonly tenantStatus: string;
};
export declare const CI_DEFAULT_TENANT_ROUTING_MODE: CiTenantRoutingMode;
export declare const CI_DEFAULT_TENANT_BASE_PATH: string;
export declare const CI_DEFAULT_TENANT_ROUTING_SCOPE: CiTenantScope;
export declare const CI_DEFAULT_TENANT_LOOKUP_PATH: string;
export declare const CI_DEFAULT_TENANT_NOT_FOUND_PATH: string;
export declare const CI_DEFAULT_TENANT_SUSPENDED_PATH: string;
export declare const CI_DEFAULT_TENANT_URL_STRATEGY: CiTenantUrlStrategy;
export declare const CI_DEFAULT_WRITE_TENANT_COOKIE: boolean;
export declare const CI_DEFAULT_REWRITE_SUBDOMAIN_TO_TENANT_PATH: boolean;
export declare const CI_DEFAULT_VALIDATE_TENANT: boolean;
//# sourceMappingURL=constants.d.ts.map