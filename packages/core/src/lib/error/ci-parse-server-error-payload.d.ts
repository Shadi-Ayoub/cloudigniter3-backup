import type { CiServerErrorPayload } from "@ci-core/types";
/**
 * Robust parser that accepts:
 * - JSON string with any of the 4 fields (title, message, severity, showRetry)
 * - Plain string (treated as message)
 * - JSON string that parses but has none of the fields → treat original string as message
 * - Error instance (uses .message with the same rules)
 * - Plain object (uses fields directly if present, else stringify and re-parse)
 */
export declare function ciParseServerErrorPayload(err: unknown): Required<CiServerErrorPayload>;
//# sourceMappingURL=ci-parse-server-error-payload.d.ts.map