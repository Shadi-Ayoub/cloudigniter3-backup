import { ciSeedTenantsHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["SeedTenants"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciSeedTenantsHandler(event, context);
