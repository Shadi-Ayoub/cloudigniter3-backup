import { defineFunction } from "@aws-amplify/backend";

export const createOrgUnitHandler = defineFunction({
  name: "create-org-unit-handler",
  resourceGroupName: "data",
});
