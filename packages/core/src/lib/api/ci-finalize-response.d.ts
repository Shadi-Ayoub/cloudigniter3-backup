import type { CiResponse } from "@ci-core/types";
/**
 * Final response normalization/enrichment hook.
 *
 * Keep this provider-neutral. Runtime/provider-specific packages may wrap
 * this helper or compose around it.
 */
export declare function ciFinalizeResponse<TResponse extends CiResponse<any, any, any, any>>(response: TResponse): Promise<TResponse>;
//# sourceMappingURL=ci-finalize-response.d.ts.map