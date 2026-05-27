import { ciSetCognitoUserPassword, ciCreateDirectHandler } from "@ci-aws/lib";

/**
 * Set a Cognito user password.
 */
export const ciSetCognitoUserPasswordHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciSetCognitoUserPassword,
});
