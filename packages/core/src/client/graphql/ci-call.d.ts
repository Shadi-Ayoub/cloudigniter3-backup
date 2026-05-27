import type { CiCallOptions, CiCallResult, CiRequest } from "@ci-core/types";
/**
 * call()
 *
 * Standard CloudIgniter client helper:
 * - POSTs a CiRequest<TInput> as JSON by default (method can be overridden).
 * - Expects a CiResponse<TBody> from the route handler.
 * - Distinguishes between:
 *   - NETWORK_ERROR         (fetch threw)
 *   - NON_JSON_RESPONSE     (no/invalid JSON from route)
 *   - HTTP_ERROR            (res.ok === false)
 *   - CI_ERROR              (response.statusCode >= 400)
 */
export declare function ciCall<TInput, TBody = unknown>(url: string, request: CiRequest<TInput>, options?: CiCallOptions): Promise<CiCallResult<TBody>>;
//# sourceMappingURL=ci-call.d.ts.map