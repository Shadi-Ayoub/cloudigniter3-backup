import type { CiGraphQLResponse, CiJsonValue, CiResponse } from "@/types";

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
type ParseErrorResponse = CiResponse<never, { error: string }, 200, 400>;

/**
 * Creates a minimal 400 error response for non-critical parsing failures.
 *
 * Important:
 * - `CiResponseMeta` no longer supports a top-level `response` field.
 * - Use `debug.response` if you want to attach a raw value for troubleshooting.
 */
function errorResponse(msg: string): ParseErrorResponse {
  return {
    ok: false,
    statusCode: 400,
    body: { error: msg },

    // CiResponseMeta
    message: "",
    // debug: { response: null },
  };
}

/**
 * Parses and normalizes `response.data` from a GraphQL response.
 *
 * - If `critical` is omitted or `true`, throws on:
 *   GraphQL errors, null/undefined data, JSON parse errors, or unsupported runtime types.
 * - If `critical === false`, returns either the parsed value (Ok) or a 400 `ParseErrorResponse`.
 *
 * `Ok` can be specified at the call site for strong typing:
 * `const data = ciParseGraphqlResponseData<{ user: { id: string } }>(resp);`
 */
export function ciParseGraphqlResponseData<Ok = CiJsonValue>(
  response: CiGraphQLResponse,
  critical?: boolean,
): Ok | ParseErrorResponse {
  const isCritical = critical ?? true;

  const firstError = response.errors?.[0];
  if (firstError) {
    const msg = `[ciParseGraphqlResponseData] Failed API call: ${String(
      firstError.message ?? "",
    )} ${String(firstError.recoverySuggestion ?? "")}`.trim();

    if (isCritical) throw new Error(msg);
    return errorResponse("Failed API Call!");
  }

  const { data } = response;

  if (data == null) {
    const msg = `[ciParseGraphqlResponseData] Empty/Null GraphQL response data`;
    if (isCritical) throw new Error(msg);
    return errorResponse("Empty/Null API Response!");
  }

  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Ok;
    } catch (err) {
      const msg = `[ciParseGraphqlResponseData] Error parsing GraphQL data JSON string: ${String(
        err,
      )}`;
      if (isCritical) throw new Error(msg);
      return errorResponse(
        `Error Parsing the Response JSON String: ${String(err)}`,
      );
    }
  }

  if (Array.isArray(data)) return data as Ok;

  if (typeof data === "number" || typeof data === "boolean") return data as Ok;

  if (typeof data === "object") return data as Ok;

  const msg = `[ciParseGraphqlResponseData] Unrecognized GraphQL data runtime type: ${typeof data}`;
  if (isCritical) throw new Error(msg);
  return errorResponse("Unrecognized API Response!");
}
