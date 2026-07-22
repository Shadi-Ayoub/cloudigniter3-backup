import type { CiModuleId } from "./CiModuleId";
import type { CiModuleRuntimeEnvironment } from "./CiModuleRuntimeEnvironment";

export type CiModuleContext<TConfig = unknown> = {
  readonly moduleId: CiModuleId;
  readonly environment: CiModuleRuntimeEnvironment;
  readonly config: TConfig;
};
