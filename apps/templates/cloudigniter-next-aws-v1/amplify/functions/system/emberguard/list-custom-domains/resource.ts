import { defineFunction } from "@aws-amplify/backend";

export const listEmberguardCustomDomainsHandler = defineFunction({
  name: "list-emberguard-custom-domains-handler",
  resourceGroupName: "data",
});
