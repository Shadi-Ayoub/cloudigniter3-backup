import { defineFunction } from "@aws-amplify/backend";

export const setTenantStatusHandler = defineFunction({
  name: "set-tenant-status-handler",
  resourceGroupName: "data",
});
