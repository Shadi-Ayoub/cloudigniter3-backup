import { ciCreateOrgUnitHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["CreateOrgUnit"]["functionHandler"];
export const handler: Handler = (event, context) =>
  ciCreateOrgUnitHandler(event, context);
