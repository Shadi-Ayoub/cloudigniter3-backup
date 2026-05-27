import { defineFunction } from '@aws-amplify/backend';

export const updateOrgUnitHandler = defineFunction({
  name: 'update-ou-handler',
  resourceGroupName: 'data',
});
