import type { CiTraceLoggerLike } from "./CiTraceLoggerLike";
export type CiStartTraceResult = {
    logger: CiTraceLoggerLike;
    done: (extra?: Record<string, unknown>) => void;
};
//# sourceMappingURL=CiStartTraceResult.d.ts.map