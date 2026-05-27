import { defineFunction } from '@aws-amplify/backend';

export const getLambdaParametersHandler = defineFunction({
  name: 'get-lambda-parameters-handler',
  resourceGroupName: 'data',
});
