import { ciGetCognitoUser, ciCreateDirectHandler } from "@ci-aws/lib";

/**
 * Get a Cognito user.
 */
export const ciGetCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciGetCognitoUser,
});
