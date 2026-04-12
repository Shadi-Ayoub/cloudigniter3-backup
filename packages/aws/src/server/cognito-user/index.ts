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
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciIsCognitoUserNotFoundError,
  ciResolveAwsAuthMode,
} from "./services";

// utility
export { ciGetCognitoAttributeValue, ciMapCognitoError } from "./utility";

// types
export type {
  CiCognitoCreateUserResult,
  CiCognitoDeleteUserResult,
  CiCognitoGetUserResult,
  CiCognitoListUsersResult,
  CiCognitoSetUserPasswordResult,
  CiCognitoUpdateUserResult,
  CiUserCoreRole,
  CiUserRegister,
  CiUserRole,
  CiUserProfileBase,
  CiUserProfile,
  CiCognitoAttributesMap,
  CiCognitoAttributes,
  CiUser,
  CiCognitoAttributeKeyValuePair,
  CiUserStatus,
  CiDataTableUserRecord,
  CiMockNameLevel,
  CiMockNameLocale,
  CiCreateCognitoUserInterface,
  CiSetCognitoUserPasswordInterface,
  CiCreateUserHandlerInterface,
  CiGetCognitoUserInterface,
  CiCreateUserProfileInterface,
  CiGetUserOptions,
  CiGetUserInterface,
  CiSetUserPasswordOptions,
  CiDeleteCognitoUserInterface,
  CiUpdateCognitoUserInterface,
} from "./types";
