import { ciListEmberguardCustomDomainsHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["ListEmberguardCustomDomains"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciListEmberguardCustomDomainsHandler(event);
};
