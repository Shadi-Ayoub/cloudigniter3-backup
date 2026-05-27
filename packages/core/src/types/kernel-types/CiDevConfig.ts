import type { CiTraceConfig } from "@ci-core/types";

export type CiDevConfig = {
  debug: {
    enabled: boolean;
  };
  traceLog: CiTraceConfig;
};
