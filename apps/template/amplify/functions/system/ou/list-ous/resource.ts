import { defineFunction } from '@aws-amplify/backend';

export const listOrgUnitsHandler = defineFunction({
  name: 'list-ous-handler',
  resourceGroupName: 'data',
});
