import type { CiMetricConfig } from "./CiMetricConfig";
export type CiTraceLoggerOptions = {
    filePath?: string;
    endpoint?: string;
    enabled?: boolean;
    source: "server" | "client";
    prettyWave?: boolean;
    truncateRate?: number;
    metrics?: CiMetricConfig;
    debug?: boolean;
    /** tag to identify caller/component; can be overridden per-log via entry.tag */
    tag?: string;
};
//# sourceMappingURL=CiTraceLoggerOptions.d.ts.map