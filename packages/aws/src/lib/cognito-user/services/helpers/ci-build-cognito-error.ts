import { ciError400, ciNormalizeThrownError } from "@cloudigniter/core/lib";
import type { CiResult } from "@cloudigniter/core/types";

/**
 * Builds a normalized Cognito service error using `ciNormalizeThrownError`.
 *
 * Purpose
 * -------
 * Standardizes how Cognito helpers convert thrown exceptions into
 * a consistent `CiResult` error response.
 *
 * Behavior
 * --------
 * - Normalizes unknown thrown values using `ciNormalizeThrownError`
 * - Produces a `ciError400` result
 * - Attaches contextual details for debugging
 *
 * This keeps service helpers small and consistent.
 */
export function ciBuildCognitoError<Ok = never>(
  message: string,
  error: unknown,
  details?: Record<string, unknown>,
): CiResult<Ok> {
  const normalizedError = ciNormalizeThrownError(error);

  return ciError400<Ok>(message, {
    error: normalizedError,
    ...details,
  });
}
