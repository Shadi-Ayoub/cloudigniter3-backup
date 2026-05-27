import type { CiFeedbackSeverity } from "./CiFeedbackSeverity";
export type CiClientFeedbackPayload = {
    id: string;
    title?: string | null;
    message: string;
    /**
     * Reuse your existing semantics.
     */
    isCritical: boolean;
    severity: CiFeedbackSeverity;
    /**
     * Optional context (debugging, trace, etc.)
     */
    meta?: Record<string, unknown> | null;
    /**
     * When created (useful for dedupe, ordering, analytics)
     */
    createdAt?: number;
};
//# sourceMappingURL=CiClientFeedbackPayload.d.ts.map