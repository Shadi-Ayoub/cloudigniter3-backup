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
// debug prob
// ─────────────────────────────────────────────────────────────
export type { CiDebugProbeProps } from "./dev-types/debug-probe-types";

// ─────────────────────────────────────────────────────────────
// devbeacon
// ─────────────────────────────────────────────────────────────
export {
  type CiDevBeaconButtonProps,
  type CiDevBeaconClientProps,
  type CiDevBeaconExtraTab,
  type CiDevBeaconExtraTabSpec,
  type CiDevBeaconLogoSpec,
  type CiDevBeaconPosition,
  type CiDevBeaconProps,
  type CiDevBeaconSize,
  type CiDevBeaconSectionToolsProps,
  type CiDevBeaconSideTabsListProps,
  type CiDevBeaconSectionStatusProps,
  type CiDevBeaconTabValue,
  type CiDevBeaconTenantInfo,
  type CiDevBeaconTraceLogViewerTextProps,
  type CiDevBeaconTraceTabProps,
  type CiDevBeaconWrapperProps,
} from "./dev-types/devbeacon-types";

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
// i18n
// ─────────────────────────────────────────────────────────────
export {
  type CiExtendedI18nConfig,
  type CiGetServerLocaleInterface,
  type CiI18nConfig,
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
// sandbox
// ─────────────────────────────────────────────────────────────
export type {
  CiAsyncResponseFunction,
  CiGenericObject,
  CiSandboxApiFunctionDefinition,
  CiSandboxButtonsGridConfig,
  CiSandboxCallbackFunction,
  CiSandboxMethodDefinition,
} from "./dev-types/sandbox-types";

// ─────────────────────────────────────────────────────────────
// security
// ─────────────────────────────────────────────────────────────
export type { CiSecuritySettings } from "./security-types";

// ─────────────────────────────────────────────────────────────
// seeder
// ─────────────────────────────────────────────────────────────
export type {
  CiClearSeederInterface,
  CiSeederAction,
  CiSeederErrorBody,
  CiSeederInput,
  CiSeederInputItem,
  CiSeedItemDef,
  CiSeederItemKey,
  CiSeedMarkerDdbItem,
  CiSeederResponseBody,
} from "./dev-types/seeder-types";

// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export type {
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
  CiCreateTenantInterface,
  CiCreateTenantApiInterface,
  CiDeleteTenantInterface,
  CiDeleteTenantApiInterface,
  CiGetTenantInterface,
  CiGetTenantBySlugInterface,
  CiGetTenantApiInterface,
  CiGetTenantBySlugApiInterface,
  CiGetTenantLookupBySlugInterface,
  CiGetTenantLookupBySlugApiInterface,
  CiListTenantsInterface,
  CiListTenantsApiInterface,
  CiSeedTenantItem,
  CiSeedTenantsApiInterface,
  CiSeedTenantsInterface,
  CiSeedTenantsResult,
  CiSeedTenantsResultItem,
  CiTenantSlugResult,
  CiTenant,
  CiTenantContext,
  CiTenantDdbTableItem,
  CiTenantHeaderKey,
  CiTenantHtmlTableRow,
  CiTenantResolutionOptions,
  CiTenantResolutionResult,
  CiTenantResolutionSource,
  CiTenantRoutingMode,
  CiTenantRoutingOptions,
  CiTenantScope,
  CiTenantSlugDdbTableItem,
  CiTenantsPageProps,
  CiTenantStatus,
  CiTenantLookupBySlugOkBody,
  CiTenantLookupBySlugNotFoundBody,
  CiUpdateTenantInterface,
  CiUpdateTenantApiInterface,
  CiTenantUrlStrategy,
} from "./tenant-types";

// ─────────────────────────────────────────────────────────────
// theme
// ─────────────────────────────────────────────────────────────
export type {
  CiClientThemeConfig,
  CiThemeAttributeStrategy,
  CiThemeConfig,
} from "./theme-types";

// ─────────────────────────────────────────────────────────────
// trace
// ─────────────────────────────────────────────────────────────
export type {
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
} from "./dev-types/trace-types";
