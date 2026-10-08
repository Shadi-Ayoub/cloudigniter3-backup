import { ciPutEmberguardRoleAssignmentHandler } from "@cloudigniter/aws/server/backend";
import type { Schema } from "../../../../data/resource";

type Handler = Schema["PutEmberguardRoleAssignment"]["functionHandler"];

export const handler: Handler = async (event, context) => {
  void context;
  return ciPutEmberguardRoleAssignmentHandler(event);
};
