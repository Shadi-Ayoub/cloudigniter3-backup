import { ciDeleteEmberguardCustomDomainHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["DeleteEmberguardCustomDomain"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciDeleteEmberguardCustomDomainHandler(event);
};
