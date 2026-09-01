import { defineFunction } from "@aws-amplify/backend";

export const setCognitoUserEnabledHandler = defineFunction({
  name: "set-cognito-user-enabled-handler",
  resourceGroupName: "data",
});
