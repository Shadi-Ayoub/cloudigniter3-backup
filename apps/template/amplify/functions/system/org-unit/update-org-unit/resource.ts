import { defineFunction } from "@aws-amplify/backend";

export const updateOrgUnitHandler = defineFunction({
  name: "update-org-unit-handler",
  resourceGroupName: "data",
});
