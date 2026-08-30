import { defineFunction } from "@aws-amplify/backend";

export const restoreTenantHandler = defineFunction({
  name: "restore-tenant-handler",
  resourceGroupName: "data",
});
