import { ciSetTenantStatusHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["SetTenantStatus"]["functionHandler"];

export const handler: Handler = async (event, context) =>
  ciSetTenantStatusHandler(event, context);
