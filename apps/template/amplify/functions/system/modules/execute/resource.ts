import { defineFunction } from "@aws-amplify/backend";
export const executeModuleHandler = defineFunction({
  name: "execute-module-handler",
  resourceGroupName: "data",
  timeoutSeconds: 30,
});
