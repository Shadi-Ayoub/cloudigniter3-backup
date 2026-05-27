import { defineFunction } from '@aws-amplify/backend';

export const getTenantBySlugHandler = defineFunction({
  name: 'get-tenant-by-slug-handler',
  resourceGroupName: 'data',
});
