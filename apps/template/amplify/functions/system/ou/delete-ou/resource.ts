import { defineFunction } from '@aws-amplify/backend';

export const deleteOrgUnitHandler = defineFunction({
  name: 'delete-ou-handler',
  resourceGroupName: 'data',
});
