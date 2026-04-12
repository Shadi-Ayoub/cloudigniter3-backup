import { ciCreateCognitoUser, ciCreateDirectHandler } from "../../../";

/**
 * Create a Cognito user.
 */
export const ciCreateCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciCreateCognitoUser,
});
