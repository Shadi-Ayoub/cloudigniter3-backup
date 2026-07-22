import type { CiServerModuleDefinition } from "../../types";

export function ciDefineServerModule<
  TConfig,
  TDefinition extends CiServerModuleDefinition<TConfig>,
>(definition: TDefinition): TDefinition {
  return definition;
}
