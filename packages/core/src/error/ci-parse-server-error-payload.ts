import type { CiErrorSeverity, CiServerErrorPayload } from "@/types";

/**
 * Robust parser that accepts:
 * - JSON string with any of the 4 fields (title, message, severity, showRetry)
 * - Plain string (treated as message)
 * - JSON string that parses but has none of the fields → treat original string as message
 * - Error instance (uses .message with the same rules)
 * - Plain object (uses fields directly if present, else stringify and re-parse)
 */
export function ciParseServerErrorPayload(
  err: unknown,
): Required<CiServerErrorPayload> {
  const validSeverities: readonly CiErrorSeverity[] = [
    "info",
    "warning",
    "error",
    "critical",
  ] as const;

  const defaults: Required<CiServerErrorPayload> = {
    title: "Application Error",
    message: "An unexpected error occurred.",
    severity: "error",
    showRetry: true,
    name: "application-error",
    stack: "default",
    raw: null,
  };

  const hasKnownKeys = (o: unknown): boolean =>
    !!o &&
    typeof o === "object" &&
    ("title" in (o as object) ||
      "message" in (o as object) ||
      "severity" in (o as object) ||
      "showRetry" in (o as object));

  const buildFromObject = (o: any): Required<CiServerErrorPayload> => {
    const severity: CiErrorSeverity =
      typeof o?.severity === "string" &&
      (validSeverities as readonly string[]).includes(o.severity)
        ? (o.severity as CiErrorSeverity)
        : defaults.severity;

    return {
      title:
        typeof o?.title === "string" && o.title.trim()
          ? o.title
          : defaults.title,
      message:
        typeof o?.message === "string" && o.message.trim()
          ? o.message
          : defaults.message,
      severity,
      showRetry:
        typeof o?.showRetry === "boolean" ? o.showRetry : defaults.showRetry,
      name: "",
      stack: "",
      raw: o,
    };
  };

  const extractFromString = (text: string): Required<CiServerErrorPayload> => {
    try {
      const parsed = JSON.parse(text);

      // JSON encoded plain string → message
      if (typeof parsed === "string") {
        return { ...defaults, message: parsed };
      }

      // If parsed object has any of the known fields, build from it.
      if (hasKnownKeys(parsed)) {
        return buildFromObject(parsed);
      }

      // Parsed JSON but contains none of the expected fields → treat ORIGINAL string as message.
      return { ...defaults, message: text };
    } catch {
      // Not JSON → use the string directly as message.
      return { ...defaults, message: text };
    }
  };

  // Error instance
  if (err instanceof Error) {
    return extractFromString(err.message || "");
  }

  // Raw string
  if (typeof err === "string") {
    return extractFromString(err);
  }

  // Plain object
  if (err && typeof err === "object") {
    // If it already has known keys, use them directly.
    if (hasKnownKeys(err)) {
      return buildFromObject(err);
    }

    // Otherwise, try stringifying and running through the same logic.
    try {
      const asJson = JSON.stringify(err);
      return extractFromString(asJson);
    } catch {
      return defaults;
    }
  }

  return defaults;
}
