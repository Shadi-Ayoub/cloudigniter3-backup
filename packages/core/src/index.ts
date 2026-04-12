// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export {
  type CiAuthMode,
  type CiAuthProviderId,
  type CiAuthUiConfig,
  type CiLoginOptions,
  type CiLogoutOptions,
  type CiPublicAuthMode,
} from "./auth";

// ─────────────────────────────────────────────────────────────
// client
// ─────────────────────────────────────────────────────────────
export {
  // cookie
  ciGetAllCookies,
  ciGetCookie,
  ciIsCookie,
  ciRemoveCookie,
  ciSetCookie,

  // env
  getEnvMode,

  // local storage
  ciClearLocalStorage,
  ciGetLocalStorageItem,
  ciGetLocalStorageKeys,
  ciLocalStorageItemsCount,
  ciLocalStorageHasItem,
  ciRemoveLocalStorageItem,
  ciSetLocalStorageItem,
} from "./client";

// ─────────────────────────────────────────────────────────────
// error
// ─────────────────────────────────────────────────────────────
export {
  ciIsErrorResponse,
  ciParseServerErrorPayload,
  ciResponseHasErrorBody,
  ciSerializeUnknownError,
  type CiClientErrorPayload,
  type CiServerErrorPayload,
} from "./error";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export {
  type CiExtendedI18nConfig,
  type CiI18nConfig,
  type CiLocale,
  type CiLocaleDirection,
  type CiLocaleSwitcherSelectProps,
} from "./i18n";

// ─────────────────────────────────────────────────────────────
// kernel
// ─────────────────────────────────────────────────────────────
export {
  type CiAuthConfig,
  type CiConfig,
  type CiResolvedConfig,
  type CiDataConfig,
  type CiRouteRuntimeConfig,
  type CiSystemItemType,
  type CiSystemTableItem,
} from "./kernel";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export { type CiInfoPageStrategy, type CiPageConfig } from "./page";

// ─────────────────────────────────────────────────────────────
// route
// ─────────────────────────────────────────────────────────────
export {
  type CiRoute,
  type CiRouteInfoPageReason,
  type CiMatchedRoute,
  type CiRoutesMap,
} from "./route";

// ─────────────────────────────────────────────────────────────
// tenant
// ─────────────────────────────────────────────────────────────
export {
  // constants
  CI_DEFAULT_TENANT_ID_HEADER_NAME,
  CI_DEFAULT_TENANT_SCOPE_HEADER_NAME,
  CI_DEFAULT_TENANT_MODE_HEADER_NAME,
  CI_DEFAULT_TENANT_STATUS_HEADER_NAME,
  CI_DEFAULT_TENANT_ID_COOKIE_NAME,
  CI_DEFAULT_TENANT_SCOPE_COOKIE_NAME,
  CI_DEFAULT_TENANT_MODE_COOKIE_NAME,
  CI_DEFAULT_TENANT_STATUS_COOKIE_NAME,
  CI_DEFAULT_TENANT_HEADERS,
  CI_DEFAULT_TENANT_COOKIES,
  CI_DEFAULT_TENANT_ROUTING_MODE,
  CI_DEFAULT_TENANT_BASE_PATH,
  CI_DEFAULT_TENANT_ROUTING_SCOPE,
  CI_DEFAULT_TENANT_LOOKUP_PATH,
  CI_DEFAULT_TENANT_NOT_FOUND_PATH,
  CI_DEFAULT_TENANT_SUSPENDED_PATH,
  CI_DEFAULT_TENANT_URL_STRATEGY,
  CI_DEFAULT_WRITE_TENANT_COOKIE,
  CI_DEFAULT_REWRITE_SUBDOMAIN_TO_TENANT_PATH,
  CI_DEFAULT_VALIDATE_TENANT,

  // types
  type CiCreateTenantInterface,
  type CiCreateTenantApiInterface,
  type CiDeleteTenantInterface,
  type CiDeleteTenantApiInterface,
  type CiGetTenantInterface,
  type CiGetTenantBySlugInterface,
  type CiGetTenantApiInterface,
  type CiGetTenantBySlugApiInterface,
  type CiGetTenantLookupBySlugInterface,
  type CiGetTenantLookupBySlugApiInterface,
  type CiListTenantsInterface,
  type CiListTenantsApiInterface,
  type CiSeedTenantItem,
  type CiSeedTenantsApiInterface,
  type CiSeedTenantsInterface,
  type CiSeedTenantsResult,
  type CiSeedTenantsResultItem,
  type CiTenantSlugResult,
  type CiTenant,
  type CiTenantContext,
  type CiTenantDdbTableItem,
  type CiTenantHeaderKey,
  type CiTenantHtmlTableRow,
  type CiTenantResolutionOptions,
  type CiTenantResolutionResult,
  type CiTenantResolutionSource,
  type CiTenantRoutingMode,
  type CiTenantRoutingOptions,
  type CiTenantScope,
  type CiTenantSlugDdbTableItem,
  type CiTenantsPageProps,
  type CiTenantStatus,
  type CiTenantLookupBySlugOkBody,
  type CiTenantLookupBySlugNotFoundBody,
  type CiUpdateTenantInterface,
  type CiUpdateTenantApiInterface,
  type CiTenantUrlStrategy,
} from "./tenant";

// ─────────────────────────────────────────────────────────────
// theme
// ─────────────────────────────────────────────────────────────
export type {
  CiClientThemeConfig,
  CiThemeAttributeStrategy,
  CiThemeConfig,
} from "./theme";

// ─────────────────────────────────────────────────────────────
// ui
// ─────────────────────────────────────────────────────────────
export { type CiMainMenuItem } from "./ui";

export {
  // ─────────────────────────────────────────────────────────────
  // api
  // ─────────────────────────────────────────────────────────────
  type CiApiInputArgs,
  type CiCoreResponseMeta,
  type CiRequest,
  type CiRequestOptions,
  type CiResponse,
  type CiResponseDebugMeta,
  type CiResponseErrorOptions,
  type CiResponseMeta,
  type CiResponseWithMeta,

  // ─────────────────────────────────────────────────────────────
  // env
  // ─────────────────────────────────────────────────────────────
  type CiDevEnv,
  type CiEnvMode,
  type CiSeedEnvMode,

  // ─────────────────────────────────────────────────────────────
  // general
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // result
  // ─────────────────────────────────────────────────────────────
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
  type CiErrorBody,
  type CiErrorPayload,
  type CiErrorSeverity,
  type CiErrorStatus,
  type CiJsonPrimitive,
  type CiJsonValue,
  type CiOkStatus,
  type CiResult,

  // ─────────────────────────────────────────────────────────────
  // settings
  // ─────────────────────────────────────────────────────────────
  ciDefineSettingsRegistry,
  ciGetSettingsValueAtPath,
  ciSetSettingsValueAtPath,
  ciMergeSettings,
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
  CI_DEFAULT_ROUTE_CORE_SETTINGS_ID,
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

  // ─────────────────────────────────────────────────────────────
  // trace
  // ─────────────────────────────────────────────────────────────
  ciStartTrace,
  type CiBuildCanonicalInput,
  type CiCanonicalRecord,
  type CiLogEntryType,
  type CiMetricConfig,
  type CiTimerRecord,
  type CiTraceConfig,
  type CiTraceLoggerOptions,
} from "./common";
