// ─────────────────────────────────────────────────────────────
// cognito & user
// ─────────────────────────────────────────────────────────────
export {
  //The Cloudigniter Cognito Class
  Cognito,

  //users
  // AWS SDK Library
  // Reference: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-cognito-identity-provider/
  awsSdkCreateCognitoUser,
  awsSdkDeleteCognitoUser,
  awsSdkGetCognitoUser,
  awsSdkListCognitoUsers,
  awsSdkSetCognitoUserPassword,
  awsSdkUpdateCognitoUser,

  //groups
  createGroup,
  listGroupsForUser,

  // Services
  ciCreateCognitoUser,
  ciDeleteCognitoUser,
  ciGetCognitoUser,
  ciSetCognitoUserPassword,
  ciUpdateCognitoUser,
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciIsCognitoUserNotFoundError,
  ciResolveAwsAuthMode,

  // utility
  ciGetCognitoAttributeValue,
  ciMapCognitoError,
} from "./cognito-user";

// ─────────────────────────────────────────────────────────────
// dynamodb
// ─────────────────────────────────────────────────────────────
export {
  Dynamodb,
  ciWithDdbClient,
  // type CiBatchWriteItemsBody,
  // type CiBatchWriteRequest,
  // type CiBatchWriteItemsResult,
  // type CiDeleteItemOptions,
  // type CiDynamoDeleteReturnValues,
  // type CiDynamoExistenceMode,
  // type CiDynamoMetricsOption,
  // type CiDynamoWriteMode,
  // type CiDynamoWriteReturnValues,
  // type CiTransactWriteOp,
  // type CiTransactWriteOptions,
} from "./dynamodb";

// ─────────────────────────────────────────────────────────────
// lambda
// ─────────────────────────────────────────────────────────────
export {
  ciAttachAwsResponseDebug,
  ciAttachHandlerDebug,
  ciBuildHandlerName,
  ciCreateDirectHandler,
  ciCreateLambdaHandler,
  ciCreateTableServiceHandler,
  ciGetLambdaCloudwatchLog,
  ciGetLambdaMetrics,
  ciResponseWithMetricsAndLogs,
} from "./lambda";
