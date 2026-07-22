import type { CiModuleContext } from "./CiModuleContext";

export type CiServerModuleContext<TConfig = unknown> =
  CiModuleContext<TConfig> & {
    readonly environment: "server";
  };
