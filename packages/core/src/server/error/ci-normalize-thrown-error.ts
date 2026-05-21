import type { CiErrorPayload } from "@/types";

/**
 * Normalize any thrown value into a consistent CiErrorPayload structure.
 *
 * This utility ensures:
 * - `message` is always a string
 * - `name` and `stack` are preserved when available
 * - `stack` is only exposed in development
 * - unknown thrown values are safely captured
 */
export function ciNormalizeThrownError(error: unknown): CiErrorPayload {
  const isDev = process.env.NODE_ENV === "development";

  // Standard JS Error
  if (error instanceof Error) {
    return {
      name: error.name ?? "Error",
      message: error.message ?? "Unknown error",
      stack: isDev ? error.stack : undefined,
      raw: error,
    };
  }

  // String thrown
  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
      raw: error,
    };
  }

  // Object with message property
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    const err = error as { message: string; name?: string; stack?: string };

    return {
      name: err.name ?? "Error",
      message: err.message,
      stack: isDev ? err.stack : undefined,
      raw: error,
    };
  }

  // Unknown thrown value
  const unknownFragment =
    isDev && error !== undefined ? `: ${String(error)}` : "";

  return {
    name: "Error",
    message: `Unknown error${unknownFragment}`,
    raw: error,
  };
}
