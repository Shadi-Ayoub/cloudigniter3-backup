import { defineFunction } from "@aws-amplify/backend";

export const deleteCognitoUserHandler = defineFunction({
  name: "delete-cognito-user-handler",
  resourceGroupName: "auth",
});
