"use client";

import type { CiTraceLoggerOptions } from "@cloudigniter/core/types";
import { CiTraceLoggerClient } from "./ci-trace-logger-client";
import { ciStartTraceCore } from "@cloudigniter/core/lib";
import type {
  CiStartTraceInit,
  CiStartTraceResult,
} from "@cloudigniter/core/types";

export function ciStartTraceClient(
  baseConfig?: Partial<CiTraceLoggerOptions>,
  overrides?: Partial<CiTraceLoggerOptions>,
  init?: CiStartTraceInit,
): CiStartTraceResult {
  return ciStartTraceCore(
    (config) => {
      if (config.enabled !== true) return null;

      return new CiTraceLoggerClient({
        ...config,
        source: "client",
        enabled: true,
      });
    },
    baseConfig,
    overrides,
    init,
  );
}
