// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
// export {
//   type CiAuthConfig,
//   type CiAuthMode,
//   type CiAuthProviderId,
//   type CiAuthUiConfig,
//   type CiLoginOptions,
//   type CiLogoutOptions,
//   type CiPublicAuthMode,
// } from "./auth";

// ─────────────────────────────────────────────────────────────
// api
// ─────────────────────────────────────────────────────────────
// export {
//   type CiApiInputArgs,
//   type CiCoreResponseMeta,
//   type CiGraphQLError,
//   type CiGraphQLResponse,
//   type CiNullable,
//   type CiRequest,
//   type CiRequestOptions,
//   type CiResponse,
//   type CiResponseDebugMeta,
//   type CiResponseErrorOptions,
//   type CiResponseMeta,
//   type CiResponseWithMeta,
// } from "./api";

// ─────────────────────────────────────────────────────────────
// client
// ─────────────────────────────────────────────────────────────
// export {
//   // cookie
//   ciGetAllCookies,
//   ciGetCookie,
//   ciIsCookie,
//   ciRemoveCookie,
//   ciSetCookie,

//   // env
//   ciGetEnvMode,

//   // local storage
//   ciClearLocalStorage,
//   ciGetLocalStorageItem,
//   ciGetLocalStorageKeys,
//   ciLocalStorageItemsCount,
//   ciLocalStorageHasItem,
//   ciRemoveLocalStorageItem,
//   ciSetLocalStorageItem,
// } from "./client";

// ─────────────────────────────────────────────────────────────
// dev
// ─────────────────────────────────────────────────────────────
export {
  CI_DEV_BEACON_DEFAULT_POSITION_CLASSES,
  CI_DEV_BEACON_LOGO,

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
// email
// ─────────────────────────────────────────────────────────────
// export type { CiEmailSettings } from "./email";

// ─────────────────────────────────────────────────────────────
// env
// ─────────────────────────────────────────────────────────────
// export { type CiDevEnv, type CiEnvMode, type CiSeedEnvMode } from "./env";

// ─────────────────────────────────────────────────────────────
// error
// ─────────────────────────────────────────────────────────────
export {
  ciIsErrorResponse,
  ciParseServerErrorPayload,
  ciResponseHasErrorBody,
  ciSerializeUnknownError,
  // type CiClientErrorPayload,
  // type CiServerErrorPayload,
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
} from "./graphql-response";

// ─────────────────────────────────────────────────────────────
// core helpers
// ─────────────────────────────────────────────────────────────
// export {
//   ciCapitalizeFirstLetter,
//   ciEscapeHTML,
//   ciGeneratePassword,
//   ciIsEmptyObject,
//   ciIsEmpty,
//   ciMergeObjects,
//   ciPascalToKebab,
//   ciSafeJsonParse,
//   ciSafeToString,
//   ciSleep,
// } from "./helpers";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export {
  ciGetLangDir,
  CI_DEFAULT_LOCALE,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  CI_DEFAULT_LOCALE_DIRECTION,
  CI_DEFAULT_LOCALE_NAME,
  CI_DEFAULT_LOCALES,
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

  // types
  // type CiCoreConfig,
  // type CiGeneralSettings,
  // type CiResolvedCoreConfig,
  // type CiDataConfig,
  // type CiSystemItemType,
  // type CiSystemTableItem,
  //
  // type CiConfigExtended,
  // type CiSystemStatus,
  // type CiSystemStatusCheckList,
  // type CiSystemStatusItem,
} from "./kernel";

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
  // type CiErrorBody,
  // type CiErrorPayload,
  // type CiErrorSeverity,
  // type CiErrorStatus,
  // type CiJsonPrimitive,
  // type CiJsonValue,
  // type CiOkStatus,
  // type CiResult,
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

  // helpers
  ciCoreRoutes,
  ciGetRoutes,

  // path
  ciGetRequestPath,

  // types
  // type CiRoute,
  // type CiRouteInfoPageReason,
  // type CiRouteRuntimeConfig,
  // type CiMatchedRoute,
  // type CiRoutesMap,
} from "./route";

// ─────────────────────────────────────────────────────────────
// security
// ─────────────────────────────────────────────────────────────
// export type { CiSecuritySettings } from "./security";

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

  // types
  // type CiBuildSettingsKeysInput,
  // type CiCoreSettingsFormValues,
  // type CiSettingsContextValue,
  // type CiCreateSettingsServiceInput,
  // type CiDeleteSettingsInput,
  // type CiGetSettingsInput,
  // type CiInitializeCoreUserSettingsIfMissingResult,
  // type CiResolvedSettings,
  // type CiSetSettingsInput,
  // type CiScopedSettingsScope,
  // type CiSeedCorePublicSettingsInput,
  // type CiSeedCorePrivateSettingsInput,
  // type CiSeedCoreSettingsInput,
  // type CiSeedCoreUserSettingsInput,
  // type CiSettings,
  // type CiSettingsId,
  // type CiSettingsKey,
  // type CiSettingsPageExtendedTabComponentProps,
  // type CiSettingsPageExtendedTab,
  // type CiSettingsPageProps,
  // type CiSettingsPath,
  // type CiSettingsProviderProps,
  // type CiSettingsRecord,
  // type CiSettingsRegistry,
  // type CiSettingsRegistryEntry,
  // type CiSettingsRegistryMap,
  // type CiSettingsService,
  // type CiSettingsScope,
  // type CiSettingsStore,
  // type CiSettingsStoreDeleteInput,
  // type CiSettingsStoreGetInput,
  // type CiSettingsStoreSetInput,
  // type CiSettingsValue,
  // type CiTargetTenantScope,
  // type CiUserSettingsPageProps,
  // type CiUseSettingsResult,
  // type CiUseSettingValueResult,
  // type CiUserSettingsFormValues,

  // ciDefineSettingsRegistry,
  // ciGetSettingsValueAtPath,
  // ciMergeSettings,
  // ciResolveSettingsPath,
  // ciSetSettingsValueAtPath,
  // ciCoreSettingsDefaults,
  // ciDefaultPrivateCoreSettings,
  // ciDefaultPublicCoreSettings,
  // ciDefaultUserCoreSettings,
  // CiEmailSettingsSchema,
  // CiGeneralSettingsSchema,
  // CiLocaleSettingsSchema,
  // CiMainMenuItemSchema,
  // CiMainMenuSettingsSchema,
  // CiMainMenuTargetSchema,
  // CiPrivateCoreSettingsSchema,
  // CiPublicCoreSettingsSchema,
  // CiSecuritySettingsSchema,
  // CiCoreSettingsFormSchema,
  // CiUserSettingsFormSchema,
  // CiThemeSettingsSchema,
  // CiUserCoreSettingsSchema,
  // CiUserLocaleSettingsSchema,
  // CiUserThemeSettingsSchema,
  // CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  // CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  // CI_DEFAULT_USER_CORE_SETTINGS_ID,
  // CI_DEFAULT_ROUTE_CORE_SETTINGS_ID,
  // type CiCanOverrideSettingsValue,
  // type CiCanOverrideSettingsValueInput,
  // type CiCoreSettingsDefaults,
  // type CiCoreSettingsFormValues,
  // type CiCreateSettingsServiceInput,
  // type CiDefineSettingsRegistryInput,
  // type CiDeleteSettingsInput,
  // type CiDeleteSettingsResult,
  // type CiEmailSettings,
  // type CiGeneralSettings,
  // type CiGetSettingsInput,
  // type CiGetSettingsResult,
  // type CiInitializeCoreUserSettingsIfMissingResult,
  // type CiInitializeSettingsIfMissingResult,
  // type CiLoadedSettingsLayers,
  // type CiResolvedSettings,
  // type CiResolvedSettingsResult,
  // type CiRouteSettingsSource,
  // type CiSetSettingsInput,
  // type CiSetSettingsResult,
  // type CiScopedSettingsScope,
  // type CiSecuritySettings,
  // type CiSeedCorePrivateSettingsInput,
  // type CiSeedCorePublicSettingsInput,
  // type CiSeedCoreSettingsInput,
  // type CiSeedCoreUserSettingsInput,
  // type CiSettings,
  // type CiSettingsClientMap,
  // type CiSettingsContext,
  // type CiSettingsDefinition,
  // type CiSettingsDefinitionMeta,
  // type CiSettingsId,
  // type CiSettingsLayerName,
  // type CiSettingsMeta,
  // type CiSettingsPageExtendedTab,
  // type CiSettingsPageExtendedTabComponentProps,
  // type CiSettingsPageProps,
  // type CiSettingsPath,
  // type CiSettingsProviderProps,
  // type CiSettingsRecord,
  // type CiSettingsRegistry,
  // type CiSettingsRegistryEntry,
  // type CiSettingsRegistryMap,
  // type CiSettingsService,
  // type CiSettingsSchema,
  // type CiSettingsScope,
  // type CiSettingsStore,
  // type CiSettingsStoreDeleteInput,
  // type CiSettingsStoreGetInput,
  // type CiSettingsStoreSetInput,
  // type CiSettingsValue,
  // type CiTargetTenantScope,
  // type CiUserLocaleSettings,
  // type CiUserThemeSettings,
  // type CiUseSettingsOptions,
  // type CiUseSettingsResult,
  // type CiUseSettingValueOptions,
  // type CiUseSettingValueResult,
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

  // types
  // type CiCreateTenantInterface,
  // type CiCreateTenantApiInterface,
  // type CiDeleteTenantInterface,
  // type CiDeleteTenantApiInterface,
  // type CiGetTenantInterface,
  // type CiGetTenantBySlugInterface,
  // type CiGetTenantApiInterface,
  // type CiGetTenantBySlugApiInterface,
  // type CiGetTenantLookupBySlugInterface,
  // type CiGetTenantLookupBySlugApiInterface,
  // type CiListTenantsInterface,
  // type CiListTenantsApiInterface,
  // type CiSeedTenantItem,
  // type CiSeedTenantsApiInterface,
  // type CiSeedTenantsInterface,
  // type CiSeedTenantsResult,
  // type CiSeedTenantsResultItem,
  // type CiTenantSlugResult,
  // type CiTenant,
  // type CiTenantContext,
  // type CiTenantDdbTableItem,
  // type CiTenantHeaderKey,
  // type CiTenantHtmlTableRow,
  // type CiTenantResolutionOptions,
  // type CiTenantResolutionResult,
  // type CiTenantResolutionSource,
  // type CiTenantRoutingMode,
  // type CiTenantRoutingOptions,
  // type CiTenantScope,
  // type CiTenantSlugDdbTableItem,
  // type CiTenantsPageProps,
  // type CiTenantStatus,
  // type CiTenantLookupBySlugOkBody,
  // type CiTenantLookupBySlugNotFoundBody,
  // type CiUpdateTenantInterface,
  // type CiUpdateTenantApiInterface,
  // type CiTenantUrlStrategy,
} from "./tenant";

// ─────────────────────────────────────────────────────────────
// theme
// ─────────────────────────────────────────────────────────────
// export type {
//   CiClientThemeConfig,
//   CiThemeAttributeStrategy,
//   CiThemeConfig,
// } from "./theme";

// ─────────────────────────────────────────────────────────────
// ui
// ─────────────────────────────────────────────────────────────
// export {
//   // about border beam
//   CiAboutBorderBeam,
//   // type CiAboutBorderBeamProps,

//   // dashboard
//   ciResolveDashboardCardViewModels,
//   ciResolveDashboardIcon,
//   // type CiDashboardCardConfig,
//   // type CiDashboardCardProps,
//   // type CiDashboardCardViewModel,
//   // type CiDashboardHeaderButtonProps,
//   // type CiDashboardIcon,
//   // type CiDashboardPageProps,

//   // data-table
//   CiDataTable,
//   CiDataTableRowActionsMenu,
//   buildDataTableColumnsWithActions,
//   // type CiDataTableCursorDataSource,
//   // type CiDataTableCursorPage,
//   // type CiDataTableCursorQuery,
//   // type CiDataTableDataMode,
//   // type CiDataTableAction,
//   // type CiDataTableCursorConfig,
//   // type CiDataTableInterface,
//   // type CiDataTablePageCache,
//   // type CiDataTableRowActionsMenuProps,
//   // type CiDataTableSortSpec,

//   // main menu
//   // type CiMainMenuItem,
//   // type CiMainMenuTarget,

//   // smart form
//   CiSmartCheckboxField,
//   CiSmartFormControl,
//   CiSmartFormDescription,
//   CiSmartFormField,
//   CiSmartFormFieldContext,
//   CiSmartFormItem,
//   CiSmartFormItemContext,
//   CiSmartFormLabel,
//   CiSmartFormMessage,
//   CiSmartInputField,
//   CiSmartJsonEditorField,
//   CiSmartTextareaField,
//   useCiFormikErrors,
//   useCiMonacoTheme,
//   useCiSmartFormField,

//   // spinner
//   CiSpinner,

//   // Shadcn
//   Badge,
//   BorderBeam,
//   // type BorderBeamProps,
//   Button,
//   buttonVariants,
//   Card,
//   CardHeader,
//   CardFooter,
//   CardTitle,
//   CardDescription,
//   CardContent,
//   Checkbox,
//   Dialog,
//   DialogPortal,
//   DialogOverlay,
//   DialogTrigger,
//   DialogClose,
//   DialogContent,
//   DialogHeader,
//   DialogFooter,
//   DialogTitle,
//   DialogDescription,
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuCheckboxItem,
//   DropdownMenuRadioItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuShortcut,
//   DropdownMenuGroup,
//   DropdownMenuPortal,
//   DropdownMenuSub,
//   DropdownMenuSubContent,
//   DropdownMenuSubTrigger,
//   DropdownMenuRadioGroup,
//   Input,
//   Label,
//   NeonGradientCard,
//   Separator,
//   ScrollArea,
//   ScrollBar,
//   Sheet,
//   SheetPortal,
//   SheetOverlay,
//   SheetTrigger,
//   SheetClose,
//   SheetContent,
//   SheetHeader,
//   SheetFooter,
//   SheetTitle,
//   SheetDescription,
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupAction,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarHeader,
//   SidebarInput,
//   SidebarInset,
//   SidebarMenu,
//   SidebarMenuAction,
//   SidebarMenuBadge,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSkeleton,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
//   SidebarProvider,
//   SidebarRail,
//   SidebarSeparator,
//   SidebarTrigger,
//   useSidebar,
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectScrollDownButton,
//   SelectScrollUpButton,
//   SelectSeparator,
//   SelectTrigger,
//   SelectValue,
//   Skeleton,
//   Textarea,
//   Tooltip,
//   TooltipTrigger,
//   TooltipContent,
//   TooltipProvider,
//   Table,
//   TableHeader,
//   TableBody,
//   TableFooter,
//   TableHead,
//   TableRow,
//   TableCell,
//   TableCaption,
//   Tabs,
//   TabsList,
//   TabsTrigger,
//   TabsContent,
//   cn,
// } from "./ui";
