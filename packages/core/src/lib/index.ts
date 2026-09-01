// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export {
  CI_ADMINISTRATOR_AUTHORITY_RANKS,
  CI_ADMINISTRATOR_ROLES,
  CI_CORE_ROLE_PRECEDENCE,
  CI_CORE_ROLES_BY_PRECEDENCE,
  CI_ACCESS_CONTROL_KEBAB_IDENTIFIER_PATTERN,
  CI_DEFAULT_ACCESS_CONTROL_DEFINITION,
  CI_ROOT_USER_IDENTITY_GROUP,
  CI_SYSTEM_SUPER_ADMIN_MANAGER_ROLE,
  ciApplyCoreAccessControlOverrides,
  ciAccessScopeContains,
  ciAssertValidAccessControlDefinition,
  ciAuthorize,
  ciCan,
  ciCanAll,
  ciCanAny,
  ciCanManageAdministrator,
  ciCanOverrideCoreAccessControl,
  ciCreateAppAccessControl,
  ciCreateAppAuthorizer,
  ciCreateAuthorizationSubject,
  ciCreateAuthorizer,
  ciCreateCoreAccessControlOverride,
  ciCreateCoreAccessControl,
  ciCreateRoleAssignment,
  ciCreateRoleAssignments,
  ciCreateRoleAssignmentsFromIdentityGroups,
  ciCreateSecurityAdministration,
  ciBuildSecurityRoleCounters,
  ciCreateScopedPrivilege,
  ciDefineAccessControl,
  ciFormatPermission,
  ciGlobalAccessScope,
  ciGetAccessControlEntryOrigin,
  ciIsCoreAccessControlEntry,
  ciIsAdministratorRole,
  ciIsAdministratorUser,
  ciIsAccessControlKebabIdentifier,
  ciMatchesAuthorizationPattern,
  ciMatchesPermission,
  ciMergeAccessControlDefinitions,
  ciMigrateLegacyPrivilegeTitles,
  ciOrgUnitAccessScope,
  ciParsePermission,
  ciResolvePrimaryRole,
  ciResolveAdministratorAuthorityRank,
  ciResolveIdentityGroupRoles,
  ciSystemAccessScope,
  ciTenantAccessScope,
  ciValidateAccessControlDefinition,
} from "./auth";

// ─────────────────────────────────────────────────────────────
// general
// ─────────────────────────────────────────────────────────────
export {
  ciCapitalizeFirstLetter,
  ciEscapeHTML,
  ciGeneratePassword,
  ciIsEmptyObject,
  ciIsEmpty,
  ciMergeObjects,
  ciNormalizePathname,
  ciPascalToKebab,
  ciSafeJsonParse,
  ciSafeToString,
  ciSleep,
} from "./general";

// ─────────────────────────────────────────────────────────────
// data table
// ─────────────────────────────────────────────────────────────
export { CI_DATA_TABLE_DEFAULT_ROW_ACTION_OVERFLOW } from "./data-table";

// ─────────────────────────────────────────────────────────────
// api
// ─────────────────────────────────────────────────────────────
export {
  // defaults
  CI_DEFAULT_REQUEST_CONTEXT_COOKIE_NAME,
  CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,

  // helpers
  ciDeserializeRequestContext,
  ciFinalizeResponse,
  ciIsResponseError,
  ciIsResponseOk,
  ciResponseError,
  ciResponseOk,
  ciSafeParseRequest,
  ciSerializeRequestContext,
} from "./api";

// ─────────────────────────────────────────────────────────────
// dev
// ─────────────────────────────────────────────────────────────
export {
  CI_DEFAULT_DEVELOPER_TOOLS_REQUIRED_ROLES,
  ciCanAccessDeveloperTools,
  // dev beacon
  ciCanAccessDevBeacon,
  ciIsDevBeaconLanguageErrorResponse,
  CI_DEV_BEACON_LOGO,
  CI_DEFAULT_DEV_BEACON_POSITION_CLASSES,
  CI_DEFAULT_DEV_BEACON_OPTIONS,

  // trace
  ciStartTraceCore,
  CiTraceLoggerBase,
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
// module
// ─────────────────────────────────────────────────────────────
export {
  ciCollectModulePackageDependencies,
  ciResolveModuleGraph,
  CiModuleError,
} from "./module";

// ─────────────────────────────────────────────────────────────
// namespace
// ─────────────────────────────────────────────────────────────
export { ciNamespaceSegmentToKebab } from "./namespace";

// ─────────────────────────────────────────────────────────────
// org unit
// ─────────────────────────────────────────────────────────────
export {
  CI_DEFAULT_ORG_UNIT_OPTIONS,
  CI_DEFAULT_ORG_UNIT_PATH_COOKIE_NAME,
  CI_DEFAULT_ORG_UNIT_PATH_HEADER_NAME,
  CI_MOCK_ORG_UNITS,
  ciOrgUnitContextAccessScope,
} from "./org-unit";

// ─────────────────────────────────────────────────────────────
// profile menu
// ─────────────────────────────────────────────────────────────
export { CI_DEFAULT_PROFILE_MENU_MESSAGES } from "./profile-menu";

// ─────────────────────────────────────────────────────────────
// resource presentation defaults
// ─────────────────────────────────────────────────────────────
export {
  CI_DEFAULT_NEW_RESOURCE_BADGE_DURATION_MS,
  ciIsNewResource,
  type CiNewResourceTimestamp,
} from "./resource";

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
  // helpers
  ciCompileRoutes,
  ciCoreRoutes,
  ciGetRoutes,
  ciGetRoutesMatcher,
  ciGetRouteSearchParams,
  ciGetRouteNamespace,
  ciMergeRouteMaps,
  ciIsProtectedPath,
  ciIsRegisteredPath,
  ciMatchRoute,
  ciResolveRouteDefinition,
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

export { ciBuildTableKey, ciBuildTableKeys } from "./table";

// ─────────────────────────────────────────────────────────────
// tenant
// ─────────────────────────────────────────────────────────────
export {
  ciBuildTenantPublicPathname,
  CI_DEFAULT_TENANT_ROUTING_OPTIONS,

  // constants
  // CI_DEFAULT_FEATURE_PATHNAME_HEADER_NAME,
  // CI_DEFAULT_FEATURE_PATHNAME_COOKIE_NAME,
  // CI_DEFAULT_TENANT_ID_HEADER_NAME,
  // CI_DEFAULT_TENANT_SCOPE_HEADER_NAME,
  // CI_DEFAULT_TENANT_SLUG_HEADER_NAME,
  // CI_DEFAULT_TENANT_MODE_HEADER_NAME,
  // CI_DEFAULT_TENANT_NAME_HEADER_NAME,
  // CI_DEFAULT_TENANT_NAME_COOKIE_NAME,
  // CI_DEFAULT_TENANT_STATUS_HEADER_NAME,
  // CI_DEFAULT_TENANT_ID_COOKIE_NAME,
  // CI_DEFAULT_TENANT_SCOPE_COOKIE_NAME,
  // CI_DEFAULT_TENANT_TYPE_HEADER_NAME,
  // CI_DEFAULT_TENANT_TYPE_COOKIE_NAME,
  // CI_DEFAULT_TENANT_MODE_COOKIE_NAME,
  // CI_DEFAULT_TENANT_STATUS_COOKIE_NAME,
  // CI_DEFAULT_TENANT_HEADERS,
  // CI_DEFAULT_TENANT_COOKIES,
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
  CI_DEV_TENANT_RESOLUTION_PROBES,

  // helpers
  ciNormalizeTenantScope,
} from "./tenant";

// ─────────────────────────────────────────────────────────────
// trace
// ─────────────────────────────────────────────────────────────
// export { ciStartTrace } from "./trace";
