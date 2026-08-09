import { ciSetEmberguardDefinitionHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["SetEmberguardDefinition"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciSetEmberguardDefinitionHandler(event);
};
