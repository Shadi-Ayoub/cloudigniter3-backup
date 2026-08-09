// ─────────────────────────────────────────────────────────────
// components
// ─────────────────────────────────────────────────────────────
export {
  // about border beam
  // CiAboutBorderBeam,

  // dashboard
  CiNextDashboardCard,
  CiNextDashboardHeaderButton,
  type CiNextDashboardCardProps,
  type CiNextDashboardHeaderButtonProps,
  // ciResolveDashboardCardViewModels,
  // ciResolveDashboardIcon,

  // data table
  // CiDataTable,
  // CiDataTableRowActionsMenu,
  // buildDataTableColumnsWithActions,

  // dev beacon
  // CiDevBeaconClient,
  // CiDevBeaconSideTabsList,
  // // CiDevBeaconWrapper,
  // ciDevBeaconGetTraceLogTextTab,
  // CiDevBeaconTraceLogViewerText,
  // CiDevBeaconTraceTab,

  // locale switcher
  // CiLocaleSwitcher,

  // main menu
  CiNextMainMenu,
  CiNextMenuItem,
  CiNextNavigationMenu,
  type CiNextMainMenuProps,

  // mark
  CiNextHeaderLogo,
  type CiNextHeaderLogoProps,

  // profile menu
  CiNextProfileMenu,

  // smart form
  // CiSmartCheckboxField,
  // CiSmartFormControl,
  // CiSmartFormDescription,
  // CiSmartFormField,
  // CiSmartFormFieldContext,
  // CiSmartFormItem,
  // CiSmartFormItemContext,
  // CiSmartFormLabel,
  // CiSmartFormMessage,
  // CiSmartInputField,
  // CiSmartJsonEditorField,
  // CiSmartTextareaField,
  // useCiFormikErrors,
  // useCiMonacoTheme,
  // useCiSmartFormField,

  // shadcn
  // Alert,
  // AlertTitle,
  // AlertDescription,
  // AlertAction,
  // Badge,
  // BorderBeam,
  // // type BorderBeamProps,
  // Button,
  // buttonVariants,
  // Card,
  // CardHeader,
  // CardFooter,
  // CardTitle,
  // CardDescription,
  // CardContent,
  // Checkbox,
  // Dialog,
  // DialogPortal,
  // DialogOverlay,
  // DialogTrigger,
  // DialogClose,
  // DialogContent,
  // DialogHeader,
  // DialogFooter,
  // DialogTitle,
  // DialogDescription,
  // DropdownMenu,
  // DropdownMenuTrigger,
  // DropdownMenuContent,
  // DropdownMenuItem,
  // DropdownMenuCheckboxItem,
  // DropdownMenuRadioItem,
  // DropdownMenuLabel,
  // DropdownMenuSeparator,
  // DropdownMenuShortcut,
  // DropdownMenuGroup,
  // DropdownMenuPortal,
  // DropdownMenuSub,
  // DropdownMenuSubContent,
  // DropdownMenuSubTrigger,
  // DropdownMenuRadioGroup,
  // Input,
  // Label,
  // NeonGradientCard,
  // Separator,
  // ScrollArea,
  // ScrollBar,
  // Sheet,
  // SheetPortal,
  // SheetOverlay,
  // SheetTrigger,
  // SheetClose,
  // SheetContent,
  // SheetHeader,
  // SheetFooter,
  // SheetTitle,
  // SheetDescription,
  // Sidebar,
  // SidebarContent,
  // SidebarFooter,
  // SidebarGroup,
  // SidebarGroupAction,
  // SidebarGroupContent,
  // SidebarGroupLabel,
  // SidebarHeader,
  // SidebarInput,
  // SidebarInset,
  // SidebarMenu,
  // SidebarMenuAction,
  // SidebarMenuBadge,
  // SidebarMenuButton,
  // SidebarMenuItem,
  // SidebarMenuSkeleton,
  // SidebarMenuSub,
  // SidebarMenuSubButton,
  // SidebarMenuSubItem,
  // SidebarProvider,
  // SidebarRail,
  // SidebarSeparator,
  // SidebarTrigger,
  // useSidebar,
  // Select,
  // SelectContent,
  // SelectGroup,
  // SelectItem,
  // SelectLabel,
  // SelectScrollDownButton,
  // SelectScrollUpButton,
  // SelectSeparator,
  // SelectTrigger,
  // SelectValue,
  // Skeleton,
  // Textarea,
  // Tooltip,
  // TooltipTrigger,
  // TooltipContent,
  // TooltipProvider,
  // Table,
  // TableHeader,
  // TableBody,
  // TableFooter,
  // TableHead,
  // TableRow,
  // TableCell,
  // TableCaption,
  // Tabs,
  // TabsList,
  // TabsTrigger,
  // TabsContent,
  // cn,

  // spinners
  // CiSpinner,

  // types
  // type CiAboutBorderBeamProps,
  // type CiAboutBorderBeamResolvedProps,
  // type CiAboutBorderBeamViewProps,

  // dashboard
  type CiDashboardCardConfig,
  type CiDashboardCardProps,
  type CiDashboardCardViewModel,
  type CiDashboardHeaderButtonProps,
  type CiDashboardIcon,
  type CiDashboardPageProps,

  // data table
  // type CiDataTableCursorDataSource,
  // type CiDataTableCursorPage,
  // type CiDataTableCursorQuery,
  // type CiDataTableDataMode,
  // type CiDataTableAction,
  // type CiDataTableCursorConfig,
  // type CiDataTableInterface,
  // type CiDataTablePageCache,
  // type CiDataTableRowActionsMenuProps,
  // type CiDataTableSortSpec,

  // main menu
  //   CiMainMenuItem,
  //   CiMainMenuTarget,

  // shadcn
  // type BorderBeamProps,

  // smart form
  // type CiFormFieldCommonProps,
  // type CiFormFieldProps,
  // type CiFormInputProps,
  // type CiFormTextareaProps,
  // type CiSmartCheckboxFieldProps,
  // type CiSmartFormFieldContextValue,
  // type CiSmartFormItemContextValue,

  // spinner
  // type CiPageSpinnerProps,
} from "./components";

// ─────────────────────────────────────────────────────────────
// pages
// ─────────────────────────────────────────────────────────────
export { CiNextSecurityDataPage } from "./pages/dashboard";

// ─────────────────────────────────────────────────────────────
// dev
// ─────────────────────────────────────────────────────────────
export {
  // debug probe
  CiDebugProbeClient,
  CiDebugProbeProvider,

  // trace
  ciStartTraceClient,
  CiTraceLoggerClient,
} from "./dev";

// ─────────────────────────────────────────────────────────────
// feedback
// ─────────────────────────────────────────────────────────────
// export {
//   // helpers
//   ciNormalizeClientThrownError,

//   // notify
//   CI_DEFAULT_FEEDBACK_CONFIG,
//   CiFeedbackHandler,
//   CiFeedbackProvider,
//   ciPresets,
//   ciNotify,
//   ciResolveFeedbackConfig,
//   useCiFeedbackStore,

//   //notify
//   type CiClientFeedbackPayload,
//   type CiDeliveryChannel,
//   type CiFeedbackHandlerProps,
//   type CiFeedbackLevel,
//   type CiFeedbackRuntimeOverrides,
//   type CiFeedbackSeverity,
//   type CiFeedbackSonnerConfig,
//   type CiFeedbackSonnerConfigResolved,
//   type CiNotifyOptions,
//   type CiToneTokens,
// } from "./feedback";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
// export {
//   // components
//   CiErrorPage,
//   CiPageHeader,
//   CiPageHeaderActionButton,
//   CiPageLoader,
//   CiPageShell,

//   // utils
//   ciBuildBreadcrumbsFromConfig,
//   useCiPageLoaderStore,
//   type CiBuildBreadcrumbsFromConfigInput,

//   // constants
//   CI_PAGE_HEADER_SCROLL_THRESHOLD,
// } from "./page";

// ─────────────────────────────────────────────────────────────
// pages
// ─────────────────────────────────────────────────────────────
export {
  // CiDevToolsPage,
  CiNextAwsLoginPage,
  CiSandboxPage,
  CiSeederPage,
  CiTenantsPage,
  CiThemePresentationPage,
} from "./pages";
