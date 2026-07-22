import { ciStartTraceCore } from "@ci-core/lib";
import type { CiTraceLoggerOptions } from "@ci-core/types";
import type { CiStartTraceInit, CiStartTraceResult } from "@ci-core/types";

import { CiTraceLoggerServer } from "./ci-trace-logger-server";

export function ciStartTraceServer(
  baseConfig?: Partial<CiTraceLoggerOptions>,
  overrides?: Partial<CiTraceLoggerOptions>,
  init?: CiStartTraceInit,
): CiStartTraceResult {
  return ciStartTraceCore(
    (config) => {
      if (config.enabled !== true) return null;

      return new CiTraceLoggerServer({
        ...config,
        source: "server",
        enabled: true,
      });
    },
    baseConfig,
    overrides,
    init,
  );
}
