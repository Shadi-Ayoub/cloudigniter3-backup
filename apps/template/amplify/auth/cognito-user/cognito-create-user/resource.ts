import { defineFunction } from "@aws-amplify/backend";

export const createCognitoUserHandler = defineFunction({
  name: "create-cognito-user-handler",
  resourceGroupName: "data",
});
