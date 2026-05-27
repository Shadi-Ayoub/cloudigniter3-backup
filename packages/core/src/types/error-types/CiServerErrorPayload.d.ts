import type { CiErrorSeverity } from "@ci-core/types";
export type CiServerErrorPayload = {
    title?: string;
    name?: string;
    message?: string;
    stack?: string;
    raw?: unknown;
    severity?: CiErrorSeverity;
    showRetry?: boolean;
};
//# sourceMappingURL=CiServerErrorPayload.d.ts.map