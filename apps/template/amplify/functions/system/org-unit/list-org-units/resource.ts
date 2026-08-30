import { defineFunction } from "@aws-amplify/backend";

export const listOrgUnitsHandler = defineFunction({
  name: "list-org-units-handler",
  resourceGroupName: "data",
});
