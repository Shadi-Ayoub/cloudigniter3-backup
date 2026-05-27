import type { CiResult } from "@ci-core/types";
/**
 * Standard success helper for returning a 200 OK result.
 *
 * Usage:
 *   return ciOk200({ userId: '123' });
 *
 * Result shape:
 * {
 *   ok: true,
 *   statusCode: 200,
 *   body: { ...data }
 * }
 */
export declare function ciOk200<TBody = unknown>(body: TBody): CiResult<TBody, never, 200, never>;
//# sourceMappingURL=ci-ok-xxx.d.ts.map