import type { CiErrorBody, CiErrorStatus, CiResult, CiJsonValue, CiErrorPayload } from "@ci-core/types";
export declare function ciErrorResult<Ok = never>(statusCode: CiErrorStatus, error: string | CiErrorPayload, details?: CiJsonValue): CiResult<Ok, CiErrorBody>;
//# sourceMappingURL=ci-error-result.d.ts.map