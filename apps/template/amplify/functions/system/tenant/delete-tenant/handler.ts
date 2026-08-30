import { ciDeleteTenantHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["DeleteTenant"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciDeleteTenantHandler(event, context);
