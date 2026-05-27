import type { CiErrorPayload } from "@ci-core/types";
/**
 * Normalize any thrown value into a consistent CiErrorPayload structure
 * for client-side React components and browser runtime usage.
 *
 * Differences from the server version:
 * - Uses `globalThis.location.hostname` instead of `process.env.NODE_ENV`
 * - Avoids direct dependency on Node.js globals
 * - Safe for browser-only environments
 * - Stack traces are only exposed on localhost/dev environments
 */
export declare function ciNormalizeClientThrownError(error: unknown): CiErrorPayload;
//# sourceMappingURL=ci-normalize-client-thrown-error.d.ts.map