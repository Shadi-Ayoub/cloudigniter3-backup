import type {
  AdminCreateUserCommandInput,
  CognitoIdentityProviderClientConfig,
} from '@aws-sdk/client-cognito-identity-provider';

export type CiCreateCognitoUserInterface = {
  cognito: AdminCreateUserCommandInput; // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/Interface/AdminCreateUserCommandInput/
  setPassword?: boolean;
  password?: string;
  permanent?: boolean;
  /** Cognito groups assigned after account creation. */
  groups?: string[];
  CognitoClientConfig?: CognitoIdentityProviderClientConfig;
};
