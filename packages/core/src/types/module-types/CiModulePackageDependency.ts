import type { CiModulePackageSection } from "./CiModulePackageSection";

export type CiModulePackageDependency = {
  readonly name: string;
  readonly specifier: string;
  readonly sections: readonly CiModulePackageSection[];
};
