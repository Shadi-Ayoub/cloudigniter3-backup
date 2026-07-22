import type { CiModuleManifest } from "./CiModuleManifest";
import type { CiServerModuleContext } from "./CiServerModuleContext";

export type CiServerModuleDefinition<TConfig = unknown> = {
  readonly manifest: CiModuleManifest;

  register?(context: CiServerModuleContext<TConfig>): void;

  initialize?(context: CiServerModuleContext<TConfig>): Promise<void> | void;

  dispose?(context: CiServerModuleContext<TConfig>): Promise<void> | void;
};
