import { ciListTenantsHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["ListTenants"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciListTenantsHandler(event, context);
