export { ciCapitalizeFirstLetter } from "./ci-capitalize-first-letter";
export { ciEscapeHTML } from "./ci-escape-html";
export { ciGeneratePassword } from "./ci-generate-password";
export { ciIsEmptyObject } from "./ci-is-empty-object";
export { ciIsEmpty } from "./ci-is-empty";
export { ciMergeObjects } from "./ci-merge-objects";
export { ciNormalizePath } from "./ci-normalize-path";
export { ciPascalToKebab } from "./ci-pascal-to-kebab";
export { ciSafeJsonParse } from "./ci-safe-json-parse";
export { ciSafeToString } from "./ci-safe-to-string";
export { ciSleep } from "./ci-sleep";

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
export { ciStartTraceCore, CiTraceLoggerBase } from "./dev";

// ─────────────────────────────────────────────────────────────
// dev beacon
// ─────────────────────────────────────────────────────────────
export {
  CI_DEV_BEACON_DEFAULT_POSITION_CLASSES,
  CI_DEV_BEACON_LOGO,
} from "./ci-devbeacon-presets";

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
// Graphql
// ─────────────────────────────────────────────────────────────
export {
  ciCall,
  ciIsGraphqlError,
  ciIsGraphqlResponse,
  ciParseGraphqlResponseData,
  ciParseGraphqlResponse,
} from "./graphql";

// ─────────────────────────────────────────────────────────────
// icon
// ─────────────────────────────────────────────────────────────
export { ciIconRegistry, ciResolveIcon } from "./icon";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export {
  ciGetLangDir,
  ciResolveNamespaceLocaleFileNames,
  CI_DEFAULT_LOCALE,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  CI_DEFAULT_LOCALE_DIRECTION,
  CI_DEFAULT_LOCALE_NAME,
  CI_DEFAULT_LOCALES,
  CI_LANGUAGES,
} from "./i18n";

// ─────────────────────────────────────────────────────────────
// kernel
// ─────────────────────────────────────────────────────────────
export {
  // defaults
  CI_DEFAULT_GLOBAL_SEGMENT,
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
} from "./kernel";

// ─────────────────────────────────────────────────────────────
// namespace
// ─────────────────────────────────────────────────────────────
export { ciNamespaceSegmentToKebab } from "./namespace";

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
} from "./result";

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

// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export {
  // helpers
  ciCreateCoreSettingsRegistry,
  ciCreateSettingsService,
  ciDefineSettingsRegistry,
  ciGetSettingsValueAtPath,
  ciMergeSettings,
  ciSetSettingsValueAtPath,

  // defaults
  ciCoreSettingsDefaults,
  ciDefaultPrivateCoreSettings,
  ciDefaultPublicCoreSettings,
  ciDefaultUserCoreSettings,

  // schemata
  CiCoreSettingsFormSchema,
  CiEmailSettingsSchema,
  CiGeneralSettingsSchema,
  CiI18nSettingsSchema,
  CiLocaleEntrySchema,
  CiMainMenuItemSchema,
  CiMainMenuSettingsSchema,
  CiPrivateCoreSettingsSchema,
  CiPublicCoreSettingsSchema,
  CiSecuritySettingsSchema,
  CiThemeSettingsSchema,
  CiUserCoreSettingsSchema,
  CiUserSettingsFormSchema,
} from "./settings";

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
} from "./tenant";

// ─────────────────────────────────────────────────────────────
// trace
// ─────────────────────────────────────────────────────────────
// export { ciStartTrace } from "./trace";
