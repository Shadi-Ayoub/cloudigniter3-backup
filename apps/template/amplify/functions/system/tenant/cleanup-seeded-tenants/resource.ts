import { defineFunction } from "@aws-amplify/backend";

export const cleanupSeededTenantsHandler = defineFunction({
  name: "cleanup-seeded-tenants-handler",
  resourceGroupName: "data",
});
