import type { CiErrorBody, CiErrorStatus, CiResponse } from "@ci-core/types";
export declare function ciIsResponseOk<Ok>(r: CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>): r is Extract<CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>, {
    ok: true;
}>;
//# sourceMappingURL=ci-is-response-ok.d.ts.map