import type {
  CiErrorBody,
  CiErrorStatus,
  CiResult,
  CiJsonValue,
  CiErrorPayload,
} from "@/types";

export function ciErrorResult<Ok = never>(
  statusCode: CiErrorStatus,
  error: string | CiErrorPayload,
  details?: CiJsonValue,
): CiResult<Ok, CiErrorBody> {
  const normalizedError =
    typeof error === "string" ? { message: error } : error;

  return {
    ok: false,
    statusCode,
    body: {
      error: normalizedError.message,
      details,
      errorMeta: normalizedError,
    },
  };
}
