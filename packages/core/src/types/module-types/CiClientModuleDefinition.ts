import type { CiClientModuleContext } from "./CiClientModuleContext";
import type { CiModuleManifest } from "./CiModuleManifest";

export type CiClientModuleDefinition<TConfig = unknown> = {
  readonly manifest: CiModuleManifest;

  register?(context: CiClientModuleContext<TConfig>): void;

  initialize?(context: CiClientModuleContext<TConfig>): Promise<void> | void;

  dispose?(context: CiClientModuleContext<TConfig>): Promise<void> | void;
};
