import { defineFunction } from "@aws-amplify/backend";

export const setCognitoUserPasswordHandler = defineFunction({
  name: "set-cognito-user-password-handler",
  resourceGroupName: "data",
});
