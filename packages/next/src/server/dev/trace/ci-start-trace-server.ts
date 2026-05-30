// import "server-only";

import type { CiTraceLoggerOptions } from "@cloudigniter/core/types";
import { CiTraceLoggerServer } from "./ci-trace-logger-server";
import { ciStartTraceCore } from "@cloudigniter/core/lib";
import type {
  CiStartTraceInit,
  CiStartTraceResult,
} from "@cloudigniter/core/types";

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
