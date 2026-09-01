//The Cloudigniter Cognito Class
export { Cognito } from "./class/Cognito";

// AWS SDK Library
// Reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/
export {
  //users
  awsSdkCreateCognitoUser,
  awsSdkDeleteCognitoUser,
  awsSdkGetCognitoUser,
  awsSdkListCognitoUsers,
  awsSdkSetCognitoUserPassword,
  awsSdkUpdateCognitoUser,

  //groups
  createGroup,
  listGroupsForUser,
} from "./aws-sdk";

// Services
export {
  ciCreateCognitoUser,
  ciDeleteCognitoUser,
  ciGetCognitoUser,
  ciSetCognitoUserPassword,
  ciUpdateCognitoUser,
  ciListCognitoUsers,
  ciSetCognitoUserEnabled,
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciIsCognitoUserNotFoundError,
  ciResolveAwsAuthMode,
} from "./services";

// utility
export {
  CI_COGNITO_ROOT_USER_GROUP,
  ciGetCognitoAttributeValue,
  ciMapCognitoError,
  ciMapCognitoUser,
} from "./utility";
