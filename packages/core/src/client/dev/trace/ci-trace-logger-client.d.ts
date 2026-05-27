import type { CiCanonicalRecord, CiTraceLoggerOptions } from "@ci-core/types";
import { CiTraceLoggerBase } from "@ci-core/lib";
export declare class CiTraceLoggerClient extends CiTraceLoggerBase {
    constructor(options: Omit<CiTraceLoggerOptions, "source"> & {
        source?: "client";
    });
    protected ciEmitWaveBanner(banner: string): void;
    protected ciEmitRecord(record: CiCanonicalRecord): void;
}
//# sourceMappingURL=ci-trace-logger-client.d.ts.map