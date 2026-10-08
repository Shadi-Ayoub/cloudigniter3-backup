import { defineFunction } from "@aws-amplify/backend";

export const putEmberguardRoleAssignmentHandler = defineFunction({
  name: "put-emberguard-role-assignment-handler",
  resourceGroupName: "data",
});
