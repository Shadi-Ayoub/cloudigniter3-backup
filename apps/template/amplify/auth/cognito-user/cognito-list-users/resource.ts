import { defineFunction } from "@aws-amplify/backend";

export const listCognitoUsersHandler = defineFunction({
  name: "list-cognito-users-handler",
  resourceGroupName: "auth",
});
