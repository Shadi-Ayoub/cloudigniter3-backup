export type CiUpdateCognitoUserInterface = {
  CognitoClientConfig?: ConstructorParameters<
    typeof import("@ci-aws/lib").Cognito
  >[0];
  cognito: {
    UserPoolId: string;
    Username: string;
    UserAttributes: Array<{
      Name: string;
      Value: string;
    }>;
  };
  /** Complete desired Cognito group membership for this user. */
  groups?: string[];
};
