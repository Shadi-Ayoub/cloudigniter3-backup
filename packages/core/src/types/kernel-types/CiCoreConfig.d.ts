import type { CiAuthConfig, CiDevConfig, CiI18nConfig, CiRoute, CiRouteRuntimeConfig, CiTenantRoutingOptions, CiThemeConfig } from "@ci-core/types";
import type { CiDataConfig } from "./CiDataConfig";
/**
 * CloudIgniter framework-level config.
 *
 * TPlatformConfig:
 * Provider/platform-specific configuration such as AWS, Azure, or GCP.
 *
 * TAppConfig:
 * Application-specific extension config supplied by the end user.
 */
export type CiCoreConfig = {
    auth: CiAuthConfig;
    data: CiDataConfig;
    route?: CiRouteRuntimeConfig;
    i18n: CiI18nConfig;
    theme: CiThemeConfig;
    tenant: CiTenantRoutingOptions;
    routes: Record<string, CiRoute>;
    dev: CiDevConfig;
};
//# sourceMappingURL=CiCoreConfig.d.ts.map