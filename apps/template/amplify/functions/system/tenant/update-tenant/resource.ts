import { defineFunction } from '@aws-amplify/backend';

export const updateTenantHandler = defineFunction({
  name: 'update-tenant-handler',
  resourceGroupName: 'data',
});
