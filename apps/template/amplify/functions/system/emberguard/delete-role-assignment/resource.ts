import { defineFunction } from "@aws-amplify/backend";

export const deleteEmberguardRoleAssignmentHandler = defineFunction({
  name: "delete-emberguard-role-assignment-handler",
  resourceGroupName: "data",
});
