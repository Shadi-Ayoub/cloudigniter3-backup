import type { CiTraceConfig } from "@ci-core/types";

export type CiDevConfig = {
  debug: {
    debugProbe: {
      enabled: boolean;
    };
    devBeacon: {
      enabled: boolean;

      /** @deprecated Developer tools are always denied outside development. */
      allowProduction: boolean;

      requiredRoles: string[];
    };
  };
  traceLog: CiTraceConfig;
};
