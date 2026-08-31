import {
  ciCreateDirectHandler,
  ciSetCognitoUserEnabled,
} from "@ci-aws/lib";

/** Enables or disables one Cognito identity. */
export const ciSetCognitoUserEnabledHandler = ciCreateDirectHandler({
  moduleUrl: import.meta.url,
  service: ciSetCognitoUserEnabled,
});
