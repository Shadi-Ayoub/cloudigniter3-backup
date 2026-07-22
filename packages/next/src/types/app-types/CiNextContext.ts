import type {
  CiAuthMode,
  CiCoreSettings,
  CiEnvMode,
  CiTenant,
} from "@cloudigniter/core/types";
import type { CiNextConfig } from "@ci-next/types";

export type CiNextContext = {
  config: CiNextConfig;
  settings?: CiCoreSettings & Record<string, unknown>;
  auth: {
    mode: CiAuthMode;
    user: {
      id: string;
      authenticated: boolean;
      roles: string[];
    };
  };
  env: {
    mode: CiEnvMode;
  };
  tenant: CiTenant;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};
