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
  CiAuthConfig,
  CiAuthMode,
  CiAuthProviderId,
  CiAuthUiConfig,
  CiLoginOptions,
  CiLogoutOptions,
  CiPublicAuthMode,
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
  CiDevBeaconLogoSpec,
  CiDevBeaconOptions,
  CiDevBeaconPosition,
  CiDevBeaconProps,
  CiDevBeaconSize,
  CiDevBeaconSectionToolsProps,
  CiDevBeaconSideTabsListProps,
  CiDevBeaconSectionStatusProps,
  CiDevBeaconTabValue,
  CiDevBeaconTenantInfo,
  CiDevBeaconTraceLogViewerTextProps,
  CiDevBeaconTraceTabProps,
  CiDevBeaconWrapperProps,

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
export {
  type CiExtendedI18nConfig,
  type CiGetServerLocaleInterface,
  type CiI18nConfig,
  type CiI18nSettings,
  type CiLocale,
  type CiLocaleDirection,
  type CiLocaleSwitcherProps,
  type CiLocaleSwitcherSelectProps,
} from "./i18n-types";

// ─────────────────────────────────────────────────────────────
// kernel
// ─────────────────────────────────────────────────────────────
export type {
  CiCoreConfig,
  CiDataConfig,
  CiDevConfig,
  CiGeneralSettings,
  CiResolvedCoreConfig,
  CiSystemItemType,
  CiSystemTableItem,
  CiSystemStatus,
  CiSystemStatusItem,
} from "./kernel-types";

// ─────────────────────────────────────────────────────────────
// main menu
// ─────────────────────────────────────────────────────────────
export type { CiMainMenuItem, CiMainMenuTarget } from "./main-menu-types";

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
  CiRoute,
  CiRouteInfoPageReason,
  CiRouteRuntimeConfig,
  CiMatchedRoute,
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
export type { CiSecuritySettings } from "./security-types";

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

// ─────────────────────────────────────────────────────────────
// tenant
// ─────────────────────────────────────────────────────────────
export type {
  // CiCreateTenantInterface,
  // CiCreateTenantApiInterface,
  // CiDeleteTenantInterface,
  // CiDeleteTenantApiInterface,
  // CiGetTenantInterface,
  CiGetTenantBySlugInterface,
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
  // CiTenant,
  CiTenantContext,
  // CiTenantDdbTableItem,
  // CiTenantHeaderKey,
  // CiTenantHtmlTableRow,
  CiTenantInfoPageStrategy,
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
