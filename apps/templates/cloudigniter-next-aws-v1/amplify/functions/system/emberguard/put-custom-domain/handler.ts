import { ciPutEmberguardCustomDomainHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["PutEmberguardCustomDomain"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciPutEmberguardCustomDomainHandler(event);
};
