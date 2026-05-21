import type { CiErrorPayload } from "@/types";

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
export function ciNormalizeClientThrownError(error: unknown): CiErrorPayload {
  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

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
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const err = error as {
      message: string;
      name?: string;
      stack?: string;
    };

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
