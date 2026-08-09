import type { CiCoreFunctionId } from "../types";
import { CI_CORE_BACKEND_MANIFEST } from "../resources";

export type CiCoreHandlerRegistryEntry = {
  /**
   * Stable function identifier used across the backend core.
   */
  id: CiCoreFunctionId;

  /**
   * Optional human-readable label for diagnostics.
   */
  label?: string;

  /**
   * Optional grouping for tooling/debugging.
   */
  group?: string;

  /**
   * Whether the handler should be enabled by default.
   */
  enabled?: boolean;
};

/**
 * Compatibility projection of the central backend manifest.
 */
export const ciCoreHandlerRegistry: readonly CiCoreHandlerRegistryEntry[] =
  CI_CORE_BACKEND_MANIFEST.modules.flatMap((module) =>
    module.handlers.map((id) => ({
      id,
      group: module.kind,
    })),
  );

export function ciGetEnabledCoreHandlerIds(): CiCoreFunctionId[] {
  return ciCoreHandlerRegistry
    .filter((entry) => entry.enabled !== false)
    .map((entry) => entry.id);
}
