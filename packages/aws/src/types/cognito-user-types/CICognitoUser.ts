import type { CognitoIdentityProviderClientConfig } from "@aws-sdk/client-cognito-identity-provider";

/** Normalized Cognito identity exposed by the AWS provider. */
export type CICognitoUser = {
  id: string;
  username: string;
  enabled: boolean;
  status:
    | "UNCONFIRMED"
    | "CONFIRMED"
    | "ARCHIVED"
    | "COMPROMISED"
    | "UNKNOWN"
    | "RESET_REQUIRED"
    | "FORCE_CHANGE_PASSWORD"
    | "EXTERNAL_PROVIDER";
  email?: string;
  emailVerified?: boolean;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  identityProvider: {
    id: "cognito-user-pool" | string;
    label: string;
    kind: "native" | "federated";
  };
  attributes: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

export type CICognitoUsersPage = {
  users: CICognitoUser[];
  paginationToken?: string;
};

export type CIListCognitoUsersInput = {
  userPoolId: string;
  limit?: number;
  paginationToken?: string;
  filter?: string;
  clientConfig?: CognitoIdentityProviderClientConfig;
};

export type CISetCognitoUserEnabledInput = {
  userPoolId: string;
  username: string;
  enabled: boolean;
  clientConfig?: CognitoIdentityProviderClientConfig;
};
