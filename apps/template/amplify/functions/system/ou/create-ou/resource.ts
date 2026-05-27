import { defineFunction } from '@aws-amplify/backend';

export const createOrgUnitHandler = defineFunction({
  name: 'create-ou-handler',
  resourceGroupName: 'data',
});
