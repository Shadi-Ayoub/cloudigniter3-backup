import { defineFunction } from "@aws-amplify/backend";

export const getEmberguardDefinitionHandler = defineFunction({
  name: "get-emberguard-definition-handler",
  resourceGroupName: "data",
});
