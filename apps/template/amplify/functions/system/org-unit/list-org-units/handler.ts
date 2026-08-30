import { ciListOrgUnitsHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["ListOrgUnits"]["functionHandler"];
export const handler: Handler = (event, context) =>
  ciListOrgUnitsHandler(event, context);
