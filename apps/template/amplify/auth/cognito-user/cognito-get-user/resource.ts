import { defineFunction } from '@aws-amplify/backend';

export const getCognitoUserHandler = defineFunction({
  name: 'get-cognito-user-handler',
  resourceGroupName: 'auth',
});
