import { defineFunction } from "@aws-amplify/backend";

export const updateCognitoUserHandler = defineFunction({
  name: "update-cognito-user-handler",
  resourceGroupName: "data",
});
