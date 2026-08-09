import { ciPutEmberguardResourceInventoryHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["PutEmberguardResourceInventory"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciPutEmberguardResourceInventoryHandler(event);
};
