import { defineFunction } from "@aws-amplify/backend";

export const deleteEmberguardCustomDomainHandler = defineFunction({
  name: "delete-emberguard-custom-domain-handler",
  resourceGroupName: "data",
});
