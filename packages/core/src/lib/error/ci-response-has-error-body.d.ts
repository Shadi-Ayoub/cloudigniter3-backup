import type { CiResponse } from "@ci-core/types";
export declare function ciResponseHasErrorBody(r: CiResponse): r is CiResponse & {
    body: {
        error: string;
    };
};
//# sourceMappingURL=ci-response-has-error-body.d.ts.map