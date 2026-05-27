import type { CiTenantRoutingMode } from '../';
export type CiTenantResolutionOptions = {
    /**
     * Enable/disable tenant routing globally.
     */
    enabled: boolean;
    tenantRoutingMode: CiTenantRoutingMode;
    /**
     * Base path for slug routing (default "/t").
     */
    tenantBasePath: string;
    /**
     * Base domain (optional) used to validate subdomain parsing.
     * Example: "example.com"
     */
    baseDomain?: string[];
    /**
     * Header key used for internal/previous-pass tenant propagation.
     * Example: "x-ci-tenant"
     */
    tenantHeaderKey: string;
    scopeHeaderName: string;
    /**
     * Optional fallback tenant when none is resolved.
     * Use with care; for protected routes you often want "none" → block/redirect.
     */
    fallbackTenantId?: string;
    rewriteSubdomainToTenantPath: boolean;
};
//# sourceMappingURL=CiTenantResolutionOptions.d.ts.map