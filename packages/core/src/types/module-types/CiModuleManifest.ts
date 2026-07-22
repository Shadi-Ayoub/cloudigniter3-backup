import type {
  CiModuleDependency,
  CiModuleId,
  CiModulePackageDependency,
  CiModuleRuntimeTargets,
  CiModuleTarget,
} from "@ci-core/types";

export type CiModuleManifest = {
  readonly schemaVersion: 1;
  readonly id: CiModuleId;
  readonly name: string;
  readonly description?: string;
  readonly enabledByDefault?: boolean;

  /**
   * Runtime facets implemented by the Module.
   */
  readonly runtime: CiModuleRuntimeTargets;

  readonly target: CiModuleTarget;
  readonly dependencies?: readonly CiModuleDependency[];
  readonly packageDependencies?: readonly CiModulePackageDependency[];
};
