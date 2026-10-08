import { defineFunction } from "@aws-amplify/backend";

export const setEmberguardDefinitionHandler = defineFunction({
  name: "set-emberguard-definition-handler",
  resourceGroupName: "data",
});
