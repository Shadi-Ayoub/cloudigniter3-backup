import type { CiLogEntryType } from "./CiLogEntryType";
export type CiBuildCanonicalInput = {
    type: CiLogEntryType;
    name?: string;
    caller?: string;
    for_?: string;
    scope?: unknown;
    event?: unknown;
    tag?: unknown;
    extra?: Record<string, unknown>;
};
//# sourceMappingURL=CiBuildCanonicalInput.d.ts.map