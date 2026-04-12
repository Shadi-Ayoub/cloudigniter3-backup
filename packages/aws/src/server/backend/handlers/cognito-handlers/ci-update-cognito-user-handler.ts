import { ciUpdateCognitoUser, ciCreateDirectHandler } from "../../../";

/**
 * Update a Cognito user.
 */
export const ciUpdateCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciUpdateCognitoUser,
});
