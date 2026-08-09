import { defineFunction } from "@aws-amplify/backend";

export const putEmberguardCustomDomainHandler = defineFunction({
  name: "put-emberguard-custom-domain-handler",
  resourceGroupName: "data",
});
