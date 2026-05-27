import type { CiErrorBody, CiErrorPayload, CiErrorStatus, CiResponse, CiResponseErrorOptions, CiResponseMeta } from "@ci-core/types";
/**
 * Canonical async error response factory.
 *
 * Use this to return a standardized CloudIgniter error envelope.
 */
export declare function ciResponseError(statusCode: CiErrorStatus, error: string | CiErrorPayload, options?: CiResponseErrorOptions): Promise<CiResponse<never, CiErrorBody, 200, CiErrorStatus, CiResponseMeta>>;
//# sourceMappingURL=ci-response-error.d.ts.map