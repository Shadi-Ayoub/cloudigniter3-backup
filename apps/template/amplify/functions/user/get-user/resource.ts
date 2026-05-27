import { defineFunction } from '@aws-amplify/backend';

export const getUser = defineFunction({
  name: 'get-user-handler',
  resourceGroupName: 'auth',
});
