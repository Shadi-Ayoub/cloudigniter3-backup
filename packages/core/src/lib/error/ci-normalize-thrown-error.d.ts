import type { CiErrorPayload } from "@ci-core/types";
/**
 * Normalize any thrown value into a consistent CiErrorPayload structure.
 *
 * This utility ensures:
 * - `message` is always a string
 * - `name` and `stack` are preserved when available
 * - `stack` is only exposed in development
 * - unknown thrown values are safely captured
 */
export declare function ciNormalizeThrownError(error: unknown): CiErrorPayload;
//# sourceMappingURL=ci-normalize-thrown-error.d.ts.map