import { ciListEmberguardRoleAssignmentsHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["ListEmberguardRoleAssignments"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciListEmberguardRoleAssignmentsHandler(event);
};
