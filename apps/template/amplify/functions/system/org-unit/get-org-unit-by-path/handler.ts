import { ciGetOrgUnitByPathHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["GetOrgUnitByPath"]["functionHandler"];
export const handler: Handler = (event, context) =>
  ciGetOrgUnitByPathHandler(event, context);
