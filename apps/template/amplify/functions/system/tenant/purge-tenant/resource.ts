import { defineFunction } from "@aws-amplify/backend";

export const purgeTenantHandler = defineFunction({
  name: "purge-tenant-handler",
  resourceGroupName: "data",
});
