export type CiDeleteCognitoUserInterface = {
  CognitoClientConfig?: ConstructorParameters<
    typeof import("@ci-aws/lib").Cognito
  >[0];
  cognito: {
    UserPoolId: string;
    Username: string;
  };
};
