/**
 * AWS/AppSync-specific authorization modes.
 */
export type CiAwsAuthMode =
  | "apiKey"
  | "iam"
  | "userPool"
  | "identityPool"
  | "oidc"
  | "lambda";
