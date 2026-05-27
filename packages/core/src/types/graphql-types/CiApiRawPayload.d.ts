import type { CiJsonValue } from "@ci-core/types";
export type CiApiRawPayload = {
    raw: {
        rawByKey: Record<string, unknown>;
        tenantId: string;
        keys: string[];
        visibility: CiJsonValue;
    };
};
//# sourceMappingURL=CiApiRawPayload.d.ts.map