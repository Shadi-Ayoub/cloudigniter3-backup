import { defineFunction } from '@aws-amplify/backend';

export const createTenantHandler = defineFunction({
  name: 'create-tenant-handler',
  resourceGroupName: 'data',
});
