export type CiUpdateCognitoUserInterface = {
  CognitoClientConfig?: ConstructorParameters<
    typeof import("../class/Cognito").Cognito
  >[0];
  cognito: {
    UserPoolId: string;
    Username: string;
    UserAttributes: Array<{
      Name: string;
      Value: string;
    }>;
  };
};
