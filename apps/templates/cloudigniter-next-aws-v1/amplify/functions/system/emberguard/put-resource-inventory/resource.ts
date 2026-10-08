import { defineFunction } from "@aws-amplify/backend";

export const putEmberguardResourceInventoryHandler = defineFunction({
  name: "put-emberguard-resource-inventory-handler",
  resourceGroupName: "data",
});
