import type { CiJsonValue } from "@ci-core/types";
/**
 * Converts an unknown thrown value into a JSON-safe payload
 * that can be placed inside `body.details`.
 *
 * Why this exists:
 * - CloudIgniter responses should remain JSON-safe.
 * - Raw `Error` objects and arbitrary thrown values are not always
 *   safe or useful to return directly.
 */
export declare function ciSerializeUnknownError(error: unknown): CiJsonValue;
//# sourceMappingURL=ci-serialize-unknown-error.d.ts.map