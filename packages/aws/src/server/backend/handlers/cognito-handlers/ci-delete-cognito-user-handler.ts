import { ciDeleteCognitoUser, ciCreateDirectHandler } from "@ci-aws/lib";

/**
 * Delete a Cognito user.
 */
export const ciDeleteCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciDeleteCognitoUser,
});
