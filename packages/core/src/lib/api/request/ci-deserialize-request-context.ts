import type { CiRequestContext } from "@ci-core/types";
import { ciIsRequestContext } from "./helpers";

/**
 * Deserializes and validates an application request context received
 * through an internal request header.
 */
export function ciDeserializeRequestContext(value: string): CiRequestContext {
  let parsed: unknown;

  try {
    parsed = JSON.parse(decodeURIComponent(value));
  } catch {
    throw new Error("The serialized CiRequestContext is malformed.");
  }

  if (!ciIsRequestContext(parsed)) {
    throw new Error("The serialized CiRequestContext is invalid or unsupported.");
  }

  return parsed;
}
