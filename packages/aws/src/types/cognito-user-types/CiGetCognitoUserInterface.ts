import type {
  AdminGetUserCommandInput,
  CognitoIdentityProviderClientConfig,
} from '@aws-sdk/client-cognito-identity-provider';

export type CiGetCognitoUserInterface = {
  cognito: AdminGetUserCommandInput;
  CognitoClientConfig?: CognitoIdentityProviderClientConfig;
};
