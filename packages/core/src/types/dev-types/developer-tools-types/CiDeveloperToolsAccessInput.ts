import type { CiEnvMode } from "../../env-types";
import type { CiDeveloperToolsActor } from "./CiDeveloperToolsActor";
import type { CiDeveloperToolsOptions } from "./CiDeveloperToolsOptions";

export type CiDeveloperToolsAccessInput = {
  envMode: CiEnvMode;
  actor: CiDeveloperToolsActor;
  options?: CiDeveloperToolsOptions;
};
