// ─────────────────────────────────────────────────────────────
// api
// ─────────────────────────────────────────────────────────────
export {
  // types
  type CiApiInputArgs,
  type CiCoreResponseMeta,
  type CiRequest,
  type CiRequestOptions,
  type CiResponse,
  type CiResponseDebugMeta,
  type CiResponseErrorOptions,
  type CiResponseMeta,
  type CiResponseWithMeta,
} from "./api";

// ─────────────────────────────────────────────────────────────
// env
// ─────────────────────────────────────────────────────────────
export { type CiDevEnv, type CiEnvMode, type CiSeedEnvMode } from "./env";

// ─────────────────────────────────────────────────────────────
// general
// ─────────────────────────────────────────────────────────────
export {
  ciCapitalizeFirstLetter,
  ciConsolePrint,
  ciEscapeHTML,
  ciGeneratePassword,
  ciGetLangDir,
  ciIsEmptyObject,
  ciIsEmpty,
  ciMergeObjects,
  ciPascalToKebab,
  ciSafeJsonParse,
  ciSafeToString,
  ciSleep,
  type CiConsolePrintInterface,
} from "./general";

// ─────────────────────────────────────────────────────────────
// result
// ─────────────────────────────────────────────────────────────
export {
  ciErrorResult,
  ciError400,
  ciError401,
  ciError403,
  ciError404,
  ciError500,
  ciIsErrorResult,
  ciIsOkResult,
  ciOkResult,
  ciOk200,

  // types
  type CiErrorBody,
  type CiErrorPayload,
  type CiErrorSeverity,
  type CiErrorStatus,
  type CiJsonPrimitive,
  type CiJsonValue,
  type CiOkStatus,
  type CiResult,
} from "./result";

// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export {
  ciDefineSettingsRegistry,
  ciGetSettingsValueAtPath,
  ciSetSettingsValueAtPath,
  ciMergeSettings,

  // constants
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
  CI_DEFAULT_ROUTE_CORE_SETTINGS_ID,

  // types
  type CiCanOverrideSettingsValue,
  type CiCanOverrideSettingsValueInput,
  type CiLoadedSettingsLayers,
  type CiResolvedSettingsResult,
  type CiScopedSettingsScope,
  type CiSettings,
  type CiSettingsContext,
  type CiSettingsDefinition,
  type CiSettingsDefinitionMeta,
  type CiSettingsLayerName,
  type CiSettingsRecord,
  type CiSettingsRegistry,
  type CiSettingsSchema,
  type CiSettingsScope,
  type CiSettingsValue,
  type CiTargetTenantScope,
} from "./settings";

// ─────────────────────────────────────────────────────────────
// trace
// ─────────────────────────────────────────────────────────────
export {
  ciStartTrace,
  type CiBuildCanonicalInput,
  type CiCanonicalRecord,
  type CiLogEntryType,
  type CiMetricConfig,
  type CiTimerRecord,
  type CiTraceConfig,
  type CiTraceLoggerOptions,
} from "./trace";
