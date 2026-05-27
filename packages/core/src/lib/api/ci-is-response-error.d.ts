import type { CiErrorBody, CiErrorStatus, CiResponse } from "@ci-core/types";
export declare function ciIsResponseError<Ok>(r: CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>): r is Extract<CiResponse<Ok, CiErrorBody, 200, CiErrorStatus>, {
    ok: false;
}>;
//# sourceMappingURL=ci-is-response-error.d.ts.map