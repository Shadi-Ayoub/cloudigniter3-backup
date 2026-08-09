import { ciDeleteEmberguardRoleAssignmentHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["DeleteEmberguardRoleAssignment"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciDeleteEmberguardRoleAssignmentHandler(event);
};
