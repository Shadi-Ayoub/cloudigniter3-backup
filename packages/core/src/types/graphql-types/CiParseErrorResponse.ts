import type { CiResponse } from "@ci-core/types";

/**
 * Error response returned when `critical === false` and parsing fails.
 *
 * This uses your canonical response union (`CiResponse`) and returns the **error branch**
 * with status code 400 and a minimal error payload.
 *
 * Notes:
 * - Meta fields must conform to `CiResponseMeta`:
 *   - `message` and `parameter` are top-level
 *   - debug information must be nested under `debug`
 */
export type CiParseErrorResponse = CiResponse<
  never,
  { error: string },
  200,
  400
>;
