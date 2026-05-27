import { ciUpdateCognitoUser, ciCreateDirectHandler } from "@ci-aws/lib";

/**
 * Update a Cognito user.
 */
export const ciUpdateCognitoUserHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciUpdateCognitoUser,
});
