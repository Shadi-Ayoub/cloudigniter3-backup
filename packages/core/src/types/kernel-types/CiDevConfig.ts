import type { CiTraceConfig } from "@ci-core/types";

export type CiDevConfig = {
  debug: {
    debugProbe: {
      enabled: boolean;
    };
  };
  traceLog: CiTraceConfig;
};
