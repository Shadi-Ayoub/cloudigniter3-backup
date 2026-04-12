import type { CiMetricConfig } from "./CiMetricConfig";

export type CiTraceLoggerOptions = {
  filePath?: string; // server-only
  endpoint?: string; // client→server
  enabled?: boolean;
  source: "server" | "client";
  prettyWave?: boolean;
  truncateRate?: number; // 0..1; used only on wave()
  metrics?: CiMetricConfig;
  debug?: boolean;
  /** tag to identify caller/component; can be overridden per-log via entry.tag */
  tag?: string;
};
