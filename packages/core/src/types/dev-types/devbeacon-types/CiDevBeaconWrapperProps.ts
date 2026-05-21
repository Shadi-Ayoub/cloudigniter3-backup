import type {
  CiDevBeaconExtraTabSpec,
  CiDevBeaconLogoSpec,
  CiDevBeaconPosition,
  CiDevBeaconTabValue,
  CiDevBeaconTenantInfo,
  CiEnvMode,
  CiLocaleDirection,
} from "@/types";

export interface CiDevBeaconWrapperProps {
  dir: CiLocaleDirection;
  position: CiDevBeaconPosition;
  env: CiEnvMode;
  defaultTab: CiDevBeaconTabValue | string;

  // SERVER-SAFE inputs:
  logo?: CiDevBeaconLogoSpec;
  extraTabSpecs?: CiDevBeaconExtraTabSpec[];

  viewportTopOffset?: string;
  viewportBottomOffset?: string;

  /** CiTenant inferred on the server from middleware headers (plain object) */
  tenant?: CiDevBeaconTenantInfo;
}
