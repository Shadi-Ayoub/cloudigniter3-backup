import type { CiCoreResponseMeta } from "./CiCoreResponseMeta";
import type { CiResponseDebugMeta } from "./CiResponseDebugMeta";

/**
 * Full response metadata used by response helpers.
 *
 * This remains cloud-agnostic. Debug payloads are intentionally typed as
 * unknown so runtime/provider packages can enrich them without coupling core
 * to a specific platform.
 */
export type CiResponseMeta = CiCoreResponseMeta & {
  debug?: CiResponseDebugMeta;
};
