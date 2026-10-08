import { ciGetEmberguardDefinitionHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["GetEmberguardDefinition"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciGetEmberguardDefinitionHandler(event);
};
