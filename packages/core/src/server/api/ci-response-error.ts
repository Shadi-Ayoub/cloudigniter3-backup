import { ciFinalizeResponse } from "./ci-finalize-response";

import type {
  CiErrorBody,
  CiErrorPayload,
  CiErrorStatus,
  CiJsonValue,
  CiResponse,
  CiResponseErrorOptions,
  CiResponseMeta,
} from "../../";

/**
 * Canonical async error response factory.
 *
 * Use this to return a standardized CloudIgniter error envelope.
 */
export async function ciResponseError(
  statusCode: CiErrorStatus,
  error: string | CiErrorPayload,
  options?: CiResponseErrorOptions,
): Promise<CiResponse<never, CiErrorBody, 200, CiErrorStatus, CiResponseMeta>> {
  const normalizedError: CiErrorPayload =
    typeof error === "string" ? { message: error } : error;

  return ciFinalizeResponse({
    ok: false,
    statusCode,
    body: {
      error: normalizedError.message,
      details: options?.details,
      errorMeta: options?.errorMeta ?? normalizedError,
    },
    ...(options?.meta ?? {}),
    ...(options?.extras ?? {}),
  });
}
