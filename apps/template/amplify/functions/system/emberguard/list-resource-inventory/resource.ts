import { defineFunction } from "@aws-amplify/backend";

export const listEmberguardResourceInventoryHandler = defineFunction({
  name: "list-emberguard-resource-inventory-handler",
  resourceGroupName: "data",
});
