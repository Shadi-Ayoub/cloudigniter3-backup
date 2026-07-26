import type { CiRequestContext } from "@ci-core/types";
import { ciIsRequestContext } from "./helpers";

/**
 * Serializes an application request context for transport through
 * an internal request header.
 */
export function ciSerializeRequestContext(context: CiRequestContext): string {
  if (!ciIsRequestContext(context)) {
    throw new Error("The CiRequestContext cannot be serialized because it is invalid.");
  }

  try {
    return encodeURIComponent(JSON.stringify(context));
  } catch {
    throw new Error("The CiRequestContext could not be serialized.");
  }
}
