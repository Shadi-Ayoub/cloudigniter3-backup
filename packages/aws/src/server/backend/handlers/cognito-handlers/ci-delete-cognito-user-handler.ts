import { ciDeleteCognitoUser, ciCreateDirectHandler } from "../../../";

/**
 * Delete a Cognito user.
 */
export const ciDeleteCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciDeleteCognitoUser,
});
