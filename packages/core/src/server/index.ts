// ─────────────────────────────────────────────────────────────
// api
// ─────────────────────────────────────────────────────────────
export {
  ciFinalizeResponse,
  ciIsResponseError,
  ciIsResponseOk,
  ciResponseError,
  ciResponseOk,
  ciSafeParseRequest,
} from "./api";

// ─────────────────────────────────────────────────────────────
// dev
// ─────────────────────────────────────────────────────────────
export {
  CI_DEV_BEACON_DEFAULT_POSITION_CLASSES,
  CI_DEV_BEACON_LOGO,
  CiDevBeacon,
  // trace
  ciStartTrace,
  // type CiBuildCanonicalInput,
  // type CiCanonicalRecord,
  // type CiLogEntryType,
  // type CiMetricConfig,
  // type CiTimerRecord,
  // type CiTraceConfig,
  // type CiTraceLoggerOptions,
} from "./dev";

// ─────────────────────────────────────────────────────────────
// error
// ─────────────────────────────────────────────────────────────
export {
  ciIsErrorResponse,
  ciNormalizeThrownError,
  ciParseServerErrorPayload,
  ciResponseHasErrorBody,
  ciSerializeUnknownError,
} from "./error";

// ─────────────────────────────────────────────────────────────
// route
// ─────────────────────────────────────────────────────────────
export {
  // defaults
  CI_DEFAULT_ROUTE_NAMESPACE_COOKIE_NAME,
  CI_DEFAULT_ROUTE_NAMESPACE_HEADER_NAME,
  CI_DEFAULT_ROUTE_PATHNAME_HEADER_NAME,
  CI_DEFAULT_ROUTE_PATHNAME_COOKIE_NAME,

  // constants
  ciCoreRoutes,

  // helpers
  ciCompileRoutes,
  ciGetRoutes,
  ciGetRoutesMatcher,
  ciGetRouteNamespace,
  ciIsProtectedPath,
  ciIsRegisteredPath,
  ciMatchRoute,
  ciResolveRoute,
} from "./route";

// settings
// export {
//   // ciBuildSettingsKeys,
//   // ciCreateDynamoSettingsStore,
//   // ciCreateSettingsService,
//   // ciCreateSettingsStore,
//   // ciGetSettingsRecord,
//   // ciMapItemToSettingsRecord,
//   // ciMapSettingsRecordToItem,
//   // ciResolveRequiredSettingsEnv,
//   // ciResolveSettingsTableName,
//   type CiBuildSettingsKeysInput,
//   type CiCreateDynamoSettingsStoreInput,
//   type CiDeleteSettingsInput,
//   type CiDeleteSettingsApiInput,
//   type CiDeleteSettingsHandlerInput,
//   type CiGetSettingsApiInput,
//   type CiGetSettingsHandlerInput,
//   type CiGetResolvedSettingsInput,
//   type CiGetSettingsRecordInput,
//   type CiResolvedSettingsEnv,
//   type CiResolveSettingsTableNameInput,
//   type CiSetSettingsApiInput,
//   type CiSetSettingsHandlerInput,
//   type CiSettingsKey,
//   type CiSettingsDdbAdapter,
//   type CiSetSettingsInput,
//   // type CiSettingsKeys,
//   type CiSettingsDeleteItemInput,
//   type CiSettingsGetItemInput,
//   type CiSettingsPutItemInput,
//   type CiSettingsService,
//   type CiSettingsStore,
//   type CiSettingsTableItem,
// } from "../settings/server";

// org units
// export {
//   ciBuildOuPK,
//   ciBuildOuSK,

//   // types
//   type CiCreateOrgUnitInterface,
//   type CiDeleteOrgUnitInterface,
//   type CiGetOrgUnitInterface,
//   type CiGetOrgUnitTreeInterface,
//   type CiListOrgUnitsInterface,
//   type CiOrgUnitCommonArgs,
//   type CiOrgUnitData,
//   type CiOrgUnitNode,
//   type CiSystemOrgUnitItem,
//   type CiStorageClientConfig,
//   type CiUpdateOrgUnitInterface,
// } from "./ou";
