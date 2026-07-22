import type { CiModuleId } from "./CiModuleId";
import type { CiModulePackageSection } from "./CiModulePackageSection";

export type CiResolvedModulePackageDependency = {
  readonly name: string;
  readonly specifier: string;
  readonly sections: readonly CiModulePackageSection[];
  readonly moduleIds: readonly CiModuleId[];
};
