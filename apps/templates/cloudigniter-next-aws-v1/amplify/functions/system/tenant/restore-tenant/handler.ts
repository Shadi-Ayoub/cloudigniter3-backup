import { ciRestoreTenantHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["RestoreTenant"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciRestoreTenantHandler(event, context);
