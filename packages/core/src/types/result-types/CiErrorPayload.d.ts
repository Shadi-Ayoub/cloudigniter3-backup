import type { CiErrorSeverity } from "./CiErrorSeverity";
export type CiErrorPayload = {
    id?: string;
    title?: string;
    name?: string;
    code?: string;
    message: string;
    isCritical?: boolean;
    severity?: CiErrorSeverity;
    showRetry?: boolean;
    stack?: string;
    raw?: unknown;
};
//# sourceMappingURL=CiErrorPayload.d.ts.map