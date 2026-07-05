import type {
  CiDevBeaconExtraTabSpec,
  CiDevBeaconLogoSpec,
  CiDevBeaconPosition,
  CiDevBeaconTabValue,
  CiDevBeaconTenantInfo,
  CiEnvMode,
  CiLocaleDirection,
} from "@ci-core/types";

export interface CiDevBeaconWrapperProps {
  locale: string;
  dir: CiLocaleDirection;
  languageDiagnosticsEndpoint: string;
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
