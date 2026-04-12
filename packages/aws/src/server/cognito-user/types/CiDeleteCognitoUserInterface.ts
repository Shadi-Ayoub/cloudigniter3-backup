export type CiDeleteCognitoUserInterface = {
  CognitoClientConfig?: ConstructorParameters<
    typeof import("../class/Cognito").Cognito
  >[0];
  cognito: {
    UserPoolId: string;
    Username: string;
  };
};
