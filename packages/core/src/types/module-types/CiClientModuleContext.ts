import type { CiModuleContext } from "./CiModuleContext";

export type CiClientModuleContext<TConfig = unknown> =
  CiModuleContext<TConfig> & {
    readonly environment: "client";
  };
