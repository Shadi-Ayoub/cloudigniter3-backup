import { ciUpdateOrgUnitHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["UpdateOrgUnit"]["functionHandler"];
export const handler: Handler = (event, context) =>
  ciUpdateOrgUnitHandler(event, context);
