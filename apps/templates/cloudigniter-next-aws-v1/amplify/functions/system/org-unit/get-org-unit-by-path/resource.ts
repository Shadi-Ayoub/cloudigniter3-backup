import { defineFunction } from "@aws-amplify/backend";

export const getOrgUnitByPathHandler = defineFunction({
  name: "get-org-unit-by-path-handler",
  resourceGroupName: "data",
});
