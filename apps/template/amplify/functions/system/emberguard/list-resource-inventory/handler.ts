import { ciListEmberguardResourceInventoryHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["ListEmberguardResourceInventory"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciListEmberguardResourceInventoryHandler(event);
};
