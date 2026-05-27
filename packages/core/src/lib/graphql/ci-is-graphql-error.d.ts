import type { CiApiResultUnion, CiErrorBody, CiErrorStatus, CiResponse } from "@ci-core/types";
export declare function ciIsGraphqlError(result: CiApiResultUnion): result is CiResponse<never, CiErrorBody, 200, CiErrorStatus> & {
    ok: false;
};
//# sourceMappingURL=ci-is-graphql-error.d.ts.map