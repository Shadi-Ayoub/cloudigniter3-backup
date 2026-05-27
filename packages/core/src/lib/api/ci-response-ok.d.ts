import type { CiResponse, CiResponseMeta } from "@ci-core/types";
/**
 * Canonical async success response factory.
 *
 * Use this in handlers and service adapters to return a standardized
 * CloudIgniter success envelope with statusCode 200.
 */
export declare function ciResponseOk<Ok>(body: Ok, meta?: CiResponseMeta): Promise<CiResponse<Ok, never, 200, never, CiResponseMeta>>;
//# sourceMappingURL=ci-response-ok.d.ts.map