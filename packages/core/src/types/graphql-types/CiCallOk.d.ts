import type { CiResponse } from "@ci-core/types";
export interface CiCallOk<TBody = unknown> {
    ok: true;
    kind: "OK";
    httpStatus: number;
    response: CiResponse<TBody>;
}
//# sourceMappingURL=CiCallOk.d.ts.map