"use client";

import type { CiTraceLoggerOptions } from "@ci-core/types";
import { CiTraceLoggerClient } from "./ci-trace-logger-client";
import { ciStartTraceCore } from "@ci-core/lib";
import type { CiStartTraceInit, CiStartTraceResult } from "@ci-core/types";

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
