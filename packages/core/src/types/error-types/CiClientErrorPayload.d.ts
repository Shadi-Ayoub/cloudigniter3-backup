import type { CiErrorSeverity } from "@ci-core/types";
export type CiClientErrorPayload = {
    id: string;
    message: string;
    isCritical: boolean;
    severity: CiErrorSeverity;
};
//# sourceMappingURL=CiClientErrorPayload.d.ts.map