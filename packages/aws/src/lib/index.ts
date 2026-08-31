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
  ciListCognitoUsers,
  ciSetCognitoUserEnabled,
  ciBuildCognitoError,
  ciCreateCognitoClient,
  ciIsCognitoUserNotFoundError,
  ciResolveAwsAuthMode,

  // utility
  ciGetCognitoAttributeValue,
  ciMapCognitoError,
  ciMapCognitoUser,
} from "./cognito-user";

// ─────────────────────────────────────────────────────────────
// dynamodb
// ─────────────────────────────────────────────────────────────
export {
  Database,
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
// tenant lifecycle
// ───────────────────────────────────────────────────────────
export {
  ciCleanupSeededTenants,
  ciDeleteTenant,
  ciListTenants,
  ciPurgeTenant,
  ciRestoreTenant,
  ciSeedTenants,
} from "./tenant";
// ─────────────────────────────────────────────────────────────
// Org Unit management
// ─────────────────────────────────────────────────────────────
export {
  ciCreateOrgUnit,
  ciGetOrgUnitByPath,
  ciListOrgUnits,
  ciUpdateOrgUnit,
} from "./org-unit";
// ─────────────────────────────────────────────────────────────
// EmberGuard
// ─────────────────────────────────────────────────────────────
export {
  ciCreateAwsEmberguardAdministrationRepository,
  ciResolveAwsCognitoIdentityGroups,
} from "./emberguard";

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
