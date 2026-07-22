import type {
  CiAuthMode,
  CiCoreSettings,
  CiEnvMode,
  CiTenantSummary,
} from "@cloudigniter/core/types";
import type { AppConfig } from "./AppConfig";

export type AppContext = {
  config: AppConfig;
  settings?: CiCoreSettings & Record<string, unknown>;
  auth: {
    mode: CiAuthMode;
    user: {
      id: string;
    };
  };
  env: {
    mode: CiEnvMode;
  };
  tenant: CiTenantSummary;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};
