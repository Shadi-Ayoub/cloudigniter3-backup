import { ciGetCognitoUser, ciCreateDirectHandler } from "../../../";

/**
 * Get a Cognito user.
 */
export const ciGetCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciGetCognitoUser,
});
