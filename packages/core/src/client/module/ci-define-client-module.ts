"use client";

import type { CiClientModuleDefinition } from "../../types";

export function ciDefineClientModule<
  TConfig,
  TDefinition extends CiClientModuleDefinition<TConfig>,
>(definition: TDefinition): TDefinition {
  return definition;
}
