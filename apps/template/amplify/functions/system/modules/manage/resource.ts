import { defineFunction } from "@aws-amplify/backend";
export const manageModulesHandler = defineFunction({
  name: "manage-modules-handler",
  resourceGroupName: "data",
  timeoutSeconds: 60,
});
