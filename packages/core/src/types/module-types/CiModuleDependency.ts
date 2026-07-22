import type { CiModuleId } from "./CiModuleId";
import type { CiModuleRuntimeEnvironment } from "./CiModuleRuntimeEnvironment";

export type CiModuleDependency = {
  readonly id: CiModuleId;
  readonly optional?: boolean;

  /**
   * Module facets to which this dependency applies.
   *
   * When omitted, the dependency applies to every runtime facet
   * implemented by the Module.
   */
  readonly environments?: readonly CiModuleRuntimeEnvironment[];
};
