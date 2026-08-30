import { ciCleanupSeededTenantsHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["CleanupSeededTenants"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciCleanupSeededTenantsHandler(event, context);
