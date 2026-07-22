import type { CiModuleHost } from "./CiModuleHost";
import type { CiModuleId } from "./CiModuleId";

export type CiResolveModuleGraphOptions = {
  readonly host: CiModuleHost;
  readonly enabled?: readonly CiModuleId[];
  readonly disabled?: readonly CiModuleId[];
};
