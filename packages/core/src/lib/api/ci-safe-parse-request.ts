/**
 * Safely parses a JSON string into a typed object.
 *
 * - Returns null if input is invalid or parsing fails
 * - Accepts unknown input (defensive boundary)
 */
export function ciSafeParseRequest<T = unknown>(input: unknown): T | null {
  if (typeof input !== "string" || input.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}
