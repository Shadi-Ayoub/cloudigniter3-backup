import { ciSetCognitoUserPassword, ciCreateDirectHandler } from "../../../";

/**
 * Set a Cognito user password.
 */
export const ciSetCognitoUserPasswordHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciSetCognitoUserPassword,
});
