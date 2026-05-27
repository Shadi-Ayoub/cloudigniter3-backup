import type { CognitoIdentityProviderClientConfig } from '@aws-sdk/client-cognito-identity-provider';

export type CiGetUserOptions = {
  clientConfig?: CognitoIdentityProviderClientConfig;
};
