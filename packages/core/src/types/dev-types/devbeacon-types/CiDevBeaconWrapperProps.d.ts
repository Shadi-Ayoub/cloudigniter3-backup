import type { CiDevBeaconExtraTabSpec, CiDevBeaconLogoSpec, CiDevBeaconPosition, CiDevBeaconTabValue, CiDevBeaconTenantInfo, CiEnvMode, CiLocaleDirection } from "@ci-core/types";
export interface CiDevBeaconWrapperProps {
    dir: CiLocaleDirection;
    position: CiDevBeaconPosition;
    env: CiEnvMode;
    defaultTab: CiDevBeaconTabValue | string;
    logo?: CiDevBeaconLogoSpec;
    extraTabSpecs?: CiDevBeaconExtraTabSpec[];
    viewportTopOffset?: string;
    viewportBottomOffset?: string;
    /** CiTenant inferred on the server from middleware headers (plain object) */
    tenant?: CiDevBeaconTenantInfo;
}
//# sourceMappingURL=CiDevBeaconWrapperProps.d.ts.map