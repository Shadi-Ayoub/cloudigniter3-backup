// packages/core/src/types/module/CiResolvedModuleGraph.ts

import type { CiModuleId } from "./CiModuleId";
import type { CiModuleManifest } from "./CiModuleManifest";

export type CiResolvedModuleGraph = {
  /**
   * All enabled Module manifests indexed by Module ID.
   */
  readonly manifestsById: ReadonlyMap<CiModuleId, CiModuleManifest>;

  /**
   * Enabled client Module manifests in dependency order.
   */
  readonly clientManifests: readonly CiModuleManifest[];

  /**
   * Enabled server Module manifests in dependency order.
   */
  readonly serverManifests: readonly CiModuleManifest[];
};
