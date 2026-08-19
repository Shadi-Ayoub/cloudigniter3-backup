// ─────────────────────────────────────────────────────────────
// api
// ─────────────────────────────────────────────────────────────
export type {
  CiApiInputArgs,
  CiCoreResponseMeta,
  CiGraphQLError,
  CiGraphQLResponse,
  CiNullable,
  CiRequest,
  CiRequestContext,
  CiRequestOptions,
  CiResponse,
  CiResponseDebugMeta,
  CiResponseErrorOptions,
  CiResponseMeta,
  CiResponseWithMeta,
} from "./api-types";

// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export type {
  CiAccessControlDefinition,
  CiAccessControlEntryOrigin,
  CiAccessControlEntryReference,
  CiAccessControlLayer,
  CiAccessControlValidationIssue,
  CiAccessRequirement,
  CiAccessScope,
  CiAccessScopeKind,
  CiActionDefinition,
  CiActionDefinitionLayer,
  CiAuthConfig,
  CiAuthenticatorPageMode,
  CiAuthMode,
  CiAuthProviderId,
  CiAuthUiConfig,
  CiAuthorizationBatchRequest,
  CiAuthorizationCombiningAlgorithm,
  CiAuthorizationDecision,
  CiAuthorizationDecisionReason,
  CiAuthorizationMatch,
  CiAuthorizationRequest,
  CiAuthorizationSubject,
  CiAuthorizer,
  CiAuthorizerOptions,
  CiCoreAccessControlOverride,
  CiCreateCoreAccessControlOverrideInput,
  CiCreateCoreAccessControlOverrideOptions,
  CiEmberguardAccessControlConfig,
  CiEmberguardConfig,
  CiGrantWindow,
  CiGlobalAccessScope,
  CiIdentityGroupRoleMappingOptions,
  CiIdentityGroupRoleResolutionOptions,
  CiLoginOptions,
  CiLogoutOptions,
  CiOrgUnitAccessScope,
  CiPrivilege,
  CiPrivilegeLayer,
  CiPrivilegeEffect,
  CiPublicAuthMode,
  CiResourceDefinition,
  CiResourceDefinitionLayer,
  CiResourceStatus,
  CiResourceStatusChange,
  CiResourceDomainDefinition,
  CiResourceDomainDefinitionLayer,
  CiResourceDomainStatus,
  CiResourceDomainStatusChange,
  CiRoleAssignment,
  CiRoleDefinition,
  CiRoleDefinitionLayer,
  CiRoleStatus,
  CiRoleStatusChange,
  CiScopedPrivilege,
  CiScopePropagation,
  CiSystemAccessScope,
  CiTenantAccessScope,
} from "./auth-types";

// ─────────────────────────────────────────────────────────────
// console print
// ─────────────────────────────────────────────────────────────
export type {
  CiConsoleLogOptions,
  CiConsolePrintInterface,
  CiPrintOutputFormat,
  CiPrintOutputType,
} from "./console-print-types";

// ─────────────────────────────────────────────────────────────
// cookie
// ─────────────────────────────────────────────────────────────
export type { CiCookieOptions, CiCookiePriority } from "./cookie-types";

// ─────────────────────────────────────────────────────────────
// dev
// ─────────────────────────────────────────────────────────────
export type {
  // debug probe
  CiDebugProbeProps,

  // devbeacon
  CiDevBeaconAccessInput,
  CiDevBeaconActor,
  CiDevBeaconButtonProps,
  CiDevBeaconClientProps,
  CiDevBeaconExtraTab,
  CiDevBeaconExtraTabSpec,
  CiDevBeaconLanguageDiagnostics,
  CiDevBeaconLanguageErrorResponse,
  CiDevBeaconLanguageFileDiagnostic,
  CiDevBeaconLanguageFileStatus,
  CiDevBeaconLanguageMessageEntry,
  CiDevBeaconLanguageMessagesResponse,
  CiDevBeaconLanguageSourceMessages,
  CiDevBeaconLanguageSummary,
  CiDevBeaconLanguageSummaryResponse,
  CiDevBeaconLogoSpec,
  CiDevBeaconModalProps,
  CiDevBeaconOptions,
  CiDevBeaconPosition,
  CiDevBeaconProps,
  CiDevBeaconSize,
  CiDevBeaconSectionToolsProps,
  CiDevBeaconSideTabsListProps,
  CiDevBeaconSectionStatusProps,
  CiDevBeaconTabValue,
  // CiDevBeaconTenantInfo,
  CiDevBeaconTraceLogViewerTextProps,
  CiDevBeaconTraceTabProps,
  // CiDevBeaconWrapperProps,

  // general
  CiDevResolutionCheck,
  CiDevResolutionCheckState,
  CiDevTenantResolutionCheckup,

  // sandbox
  CiAsyncResponseFunction,
  CiGenericObject,
  CiSandboxApiFunctionDefinition,
  CiSandboxButtonsGridConfig,
  CiSandboxCallbackFunction,
  CiSandboxMethodDefinition,

  // seeder
  CiClearSeederInterface,
  CiSeederAction,
  CiSeederErrorBody,
  CiSeederInput,
  CiSeederInputItem,
  CiSeedItemDef,
  CiSeederItemKey,
  CiSeedMarkerDdbItem,
  CiSeederResponseBody,

  // trace
  CiBuildCanonicalInput,
  CiCanonicalRecord,
  CiLogEntryType,
  CiMetricConfig,
  CiStartTraceInit,
  CiStartTraceResult,
  CiTimerRecord,
  CiTraceConfig,
  CiTraceLoggerFactory,
  CiTraceLoggerLike,
  CiTraceLoggerOptions,
} from "./dev-types";

// ─────────────────────────────────────────────────────────────
// email
// ─────────────────────────────────────────────────────────────
export type { CiEmailSettings } from "./email-types";

// ─────────────────────────────────────────────────────────────
// env
// ─────────────────────────────────────────────────────────────
export type { CiDevEnv, CiEnvMode, CiSeedEnvMode } from "./env-types";

// ─────────────────────────────────────────────────────────────
// error
// ─────────────────────────────────────────────────────────────
export type { CiClientErrorPayload, CiServerErrorPayload } from "./error-types";

// ─────────────────────────────────────────────────────────────
// graphql
// ─────────────────────────────────────────────────────────────
export type {
  CiApiRawPayload,
  CiApiResultUnion,
  CiCallErrorKind,
  CiCallOk,
  CiCallError,
  CiCallOptions,
  CiCallResult,
  CiParseErrorResponse,
} from "./graphql-types";

// ─────────────────────────────────────────────────────────────
// icon
// ─────────────────────────────────────────────────────────────
export type { CiAppIcon, CiBuiltInIcon, CiIconName } from "./icon-types";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export type {
  CiExtendedI18nConfig,
  CiGetServerLocaleInterface,
  CiI18nConfig,
  CiI18nSettings,
  CiLanguageFileDiagnostic,
  CiLanguageFileStatus,
  CiLocale,
  CiLocaleDirection,
  CiLocaleSwitcherProps,
  CiLocaleSwitcherSelectProps,
} from "./i18n-types";

// ─────────────────────────────────────────────────────────────
// kernel
// ─────────────────────────────────────────────────────────────
export type {
  CiCoreConfig,
  CiDataConfig,
  CiDevConfig,
  CiGeneralSettings,
  CiPlatformId,
  CiProviderId,
  CiRequestConfig,
  CiResolvedCoreConfig,
  CiRootLayoutContext,
  CiSystemItemType,
  CiSystemTableItem,
  CiSystemStatus,
  CiSystemStatusItem,
} from "./kernel-types";

// ─────────────────────────────────────────────────────────────
// main menu
// ─────────────────────────────────────────────────────────────
export type {
  CiMainMenuItem,
  CiMainMenuTarget,
  CiMenuItemProps,
  CiNavigationMenuProps,
} from "./main-menu-types";

// ─────────────────────────────────────────────────────────────
// module
// ─────────────────────────────────────────────────────────────
export type {
  CiClientModuleContext,
  CiClientModuleDefinition,
  CiModuleContext,
  CiModuleDependency,
  CiModuleErrorCode,
  CiModuleHost,
  CiModuleId,
  CiModuleManifest,
  CiModulePackageDependency,
  CiModulePackageSection,
  CiModuleRuntimeEnvironment,
  CiModuleRuntimeTargets,
  CiModuleTarget,
  CiResolvedModuleGraph,
  CiResolvedModulePackageDependency,
  CiResolveModuleGraphOptions,
  CiServerModuleContext,
  CiServerModuleDefinition,
} from "./module-types";

// ─────────────────────────────────────────────────────────────
// org unit
// ─────────────────────────────────────────────────────────────
export type {
  CiGetOrgUnitByPathInterface,
  CiLookupOrgUnitInput,
  CiLookupOrgUnitResult,
  CiOrgUnitContext,
  CiOrgUnitRoutingOptions,
  CiOrgUnitStatus,
  CiResolveOrgUnitInput,
  CiResolveOrgUnitResult,
} from "./org-unit-types";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export type {
  CiBreadcrumbItem,
  CiCollapsiblePageHeaderProps,
  CiCorePageConfig,
  CiErrorPageProps,
  CiInfoPageStrategy,
  CiPageCoreConfig,
  CiPageHeaderActionButtonProps,
  CiPageSetup,
  CiPageShellProps,
} from "./page-types";

// ─────────────────────────────────────────────────────────────
// profile menu
// ─────────────────────────────────────────────────────────────
export type {
  CiProfileMenuItem,
  CiProfileMenuMessages,
  CiProfileMenuProps,
} from "./profile-menu";

// ─────────────────────────────────────────────────────────────
// result
// ─────────────────────────────────────────────────────────────
export type {
  CiErrorBody,
  CiErrorPayload,
  CiErrorSeverity,
  CiErrorStatus,
  CiJsonPrimitive,
  CiJsonValue,
  CiOkStatus,
  CiResult,
} from "./result-types";

// ─────────────────────────────────────────────────────────────
// route
// ─────────────────────────────────────────────────────────────
export type {
  CiMatchedRoute,
  CiRoute,
  CiRouteDefinition,
  CiRouteInfoPageReason,
  CiRouteMatch,
  CiRouteMatchKind,
  CiRoutePattern,
  CiRouteRuntimeConfig,
  CiRouteSearchParams,
  CiRoutesMap,
} from "./route-types";

// ─────────────────────────────────────────────────────────────
// scope
// ─────────────────────────────────────────────────────────────
export type {
  CiResolvedPathnameContext,
  CiResolvedScopeContext,
  CiScopeKind,
} from "./scope-types";

// ─────────────────────────────────────────────────────────────
// security
// ─────────────────────────────────────────────────────────────
export type {
  CiSecurityActor,
  CiSecurityAdministration,
  CiSecurityAdministrationOptions,
  CiSecurityAdministrationRepository,
  CiSecurityAssignmentRecord,
  CiSecurityAssignmentScope,
  CiSecurityBaseRecord,
  CiSecurityCapabilities,
  CiSecurityEntryOrigin,
  CiSecurityIdentityGroup,
  CiSecurityIdentityGroupRecord,
  CiSecurityMutationResult,
  CiSecurityPermissionRecord,
  CiSecurityRecord,
  CiSecurityRecordKind,
  CiSecurityRecordsByKind,
  CiSecurityResourceRecord,
  CiSecurityResourceDomainRecord,
  CiCreateSecurityResourceDomainInput,
  CiSetSecurityResourceDomainStatusInput,
  CiSetSecurityResourceStatusInput,
  CiSecurityRoleRecord,
  CiSecurityRoleCounters,
  CiSecurityRoleCountersById,
  CiSetSecurityRoleStatusInput,
  CiSecuritySettings,
  CiSecurityStoredRoleAssignment,
} from "./security-types";

// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export type {
  // newest
  CiAppSettings,
  CiCoreSettings,
  CiPrivateCoreSettings,
  CiPublicCoreSettings,
  CiUserCoreSettings,

  // old
  CiBuildSettingsKeysInput,
  CiSettingsContextValue,
  // CiCanOverrideSettingsValue,
  // CiCanOverrideSettingsValueInput,
  // CiCoreSettingsDefaults,
  // CiCoreSettingsFormValues,
  CiCreateSettingsServiceInput,
  // CiDefineSettingsRegistryInput,
  CiDeleteSettingsInput,
  // CiDeleteSettingsResult,
  // CiEmailSettings,
  // CiGeneralSettings,
  CiGetSettingsInput,
  // CiGetSettingsResult,
  CiInitializeCoreUserSettingsIfMissingResult,
  // CiInitializeSettingsIfMissingResult,
  // CiLoadedSettingsLayers,
  CiResolvedSettings,
  // CiResolvedSettingsResult,
  // CiRouteSettingsSource,
  CiSetSettingsInput,
  // CiSetSettingsResult,
  CiScopedSettingsScope,
  // CiSecuritySettings,
  CiSeedCorePrivateSettingsInput,
  CiSeedCorePublicSettingsInput,
  CiSeedCoreSettingsInput,
  CiSeedCoreUserSettingsInput,
  CiSettings,
  // CiSettingsClientMap,
  // CiSettingsContext,
  CiSettingsDefinition,
  CiSettingsDefaults,
  // CiSettingsDefinitionMeta,
  CiSettingsId,
  CiSettingsKey,
  // CiSettingsLayerName,
  CiSettingsMeta,
  CiSettingsPageExtendedTab,
  CiSettingsPageExtendedTabComponentProps,
  CiSettingsPageProps,
  CiSettingsPath,
  CiSettingsProviderProps,
  CiSettingsRecord,
  CiSettingsRegistry,
  CiSettingsRegistryEntry,
  CiSettingsRegistryMap,
  CiSettingsService,
  // CiSettingsSchema,
  CiSettingsScope,
  CiSettingsStore,
  CiSettingsStoreDeleteInput,
  CiSettingsStoreGetInput,
  CiSettingsStoreSetInput,
  CiSettingsValue,
  CiTargetTenantScope,
  // CiUserLocaleSettings,
  // CiUserThemeSettings,
  // CiUseSettingsOptions,
  CiUserSettingsPageProps,
  CiUseSettingsResult,
  // CiUseSettingValueOptions,
  CiUseSettingValueResult,
  CiCoreSettingsFormValues,
  CiUserSettingsFormValues,

  //
  CiGetSettingsApiInterface,
  CiGetSettingsHandlerInput,
  CiGetSettingsHandlerOutput,
  CiSettingsGroupResult,
} from "./settings-types";

export type {
  CiBuildTableKeysInput,
  CiTableKeySegments,
  CiTableKeys,
} from "./table-types";

// ─────────────────────────────────────────────────────────────
// tenant
// ─────────────────────────────────────────────────────────────
export type {
  CiBuildTenantPublicPathnameInput,
  // CiCreateTenantInterface,
  // CiCreateTenantApiInterface,
  // CiDeleteTenantInterface,
  // CiDeleteTenantApiInterface,
  // CiGetTenantInterface,
  CiGetTenantBySlugInterface,
  CiResolveTenantContextResult,
  // CiGetTenantApiInterface,
  // CiGetTenantBySlugApiInterface,
  // CiGetTenantLookupBySlugInterface,
  // CiGetTenantLookupBySlugApiInterface,
  // CiListTenantsInterface,
  // CiListTenantsApiInterface,
  // CiSeedTenantItem,
  // CiSeedTenantsApiInterface,
  // CiSeedTenantsInterface,
  // CiSeedTenantsResult,
  // CiSeedTenantsResultItem,
  // CiTenantSlugResult,
  CiTenant,
  CiTenantContext,
  CiTenantDdbTableItem,
  // CiTenantHeaderKey,
  CiTenantHtmlTableRow,
  CiTenantInfoPageStrategy,
  CiTenantLookupResult,
  CiTenantMode,
  CiTenantResolutionOptions,
  CiTenantResolutionResult,
  CiTenantResolutionSource,
  CiTenantRoutingOptions,
  // CiTenantRoutingOptions,
  CiTenantScope,
  // CiTenantSlugDdbTableItem,
  // CiTenantsPageProps,
  CiTenantStatus,
  // CiTenantLookupBySlugOkBody,
  // CiTenantLookupBySlugNotFoundBody,
  // CiUpdateTenantInterface,
  // CiUpdateTenantApiInterface,
  // CiTenantUrlStrategy,
  // CiTenantSummary,
} from "./tenant-types";

// ─────────────────────────────────────────────────────────────
// theme
// ─────────────────────────────────────────────────────────────
export type {
  CiClientThemeConfig,
  CiThemeAttributeStrategy,
  CiThemeConfig,
  CiThemeSettings,
} from "./theme-types";

// ─────────────────────────────────────────────────────────────
// user
// ─────────────────────────────────────────────────────────────
export type { CiCoreRole, CiUser } from "./user-types";
