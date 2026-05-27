import { defineFunction } from '@aws-amplify/backend';

export const getTenantHandler = defineFunction({
  name: 'get-tenant-handler',
  resourceGroupName: 'data',
});
