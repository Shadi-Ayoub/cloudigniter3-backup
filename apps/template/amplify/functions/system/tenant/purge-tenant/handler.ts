import { ciPurgeTenantHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["PurgeTenant"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciPurgeTenantHandler(event, context);
