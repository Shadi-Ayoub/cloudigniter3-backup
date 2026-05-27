import { ciCreateCognitoUser, ciCreateDirectHandler } from "@ci-aws/lib";

/**
 * Create a Cognito user.
 */
export const ciCreateCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciCreateCognitoUser,
});
