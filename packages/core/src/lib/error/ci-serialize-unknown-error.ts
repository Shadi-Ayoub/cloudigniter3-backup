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
export function ciSerializeUnknownError(error: unknown): CiJsonValue {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? "",
    };
  }

  if (typeof error === "string") return error;
  if (typeof error === "number" || typeof error === "boolean" || error === null)
    return error;

  try {
    return JSON.parse(JSON.stringify(error)) as CiJsonValue;
  } catch {
    return String(error);
  }
}
