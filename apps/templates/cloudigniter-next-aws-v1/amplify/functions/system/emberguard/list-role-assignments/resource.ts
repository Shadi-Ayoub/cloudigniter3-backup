import { defineFunction } from "@aws-amplify/backend";

export const listEmberguardRoleAssignmentsHandler = defineFunction({
  name: "list-emberguard-role-assignments-handler",
  resourceGroupName: "data",
});
