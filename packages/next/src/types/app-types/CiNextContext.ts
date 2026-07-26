import type {
  CiAuthMode,
  CiCoreSettings,
  CiEnvMode,
  CiOrgUnitContext,
  CiRoute,
  CiTenantContext,
  CiUser,
} from "@cloudigniter/core/types";
import type { CiNextConfig, CiNextStatus } from "@ci-next/types";

export type CiNextContext = {
  config: CiNextConfig;
  settings?: CiCoreSettings & Record<string, unknown>;
  auth: {
    mode: CiAuthMode;
    user: CiUser;
  };
  env: {
    mode: CiEnvMode;
  };
  tenant: CiTenantContext | null;
  orgUnit: CiOrgUnitContext | null;
  featurePathname: string | null;
  route: CiRoute | null;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  status?: CiNextStatus;
};
