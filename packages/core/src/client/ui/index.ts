// ─────────────────────────────────────────────────────────────
// components
// ─────────────────────────────────────────────────────────────
export {
  // about border beam
  CiAboutBorderBeam,

  // dashboard
  ciResolveDashboardCardViewModels,
  ciResolveDashboardIcon,

  // data-table
  CiDataTable,
  CiDataTableRowActionsMenu,
  buildDataTableColumnsWithActions,

  // dev beacon
  CiDevBeaconClient,
  CiDevBeaconSideTabsList,
  CiDevBeaconWrapper,
  ciDevBeaconGetTraceLogTextTab,
  CiDevBeaconTraceLogViewerText,
  CiDevBeaconTraceTab,

  //locale switcher
  CiLocaleSwitcher,

  // smart form
  CiSmartCheckboxField,
  CiSmartFormControl,
  CiSmartFormDescription,
  CiSmartFormField,
  CiSmartFormFieldContext,
  CiSmartFormItem,
  CiSmartFormItemContext,
  CiSmartFormLabel,
  CiSmartFormMessage,
  CiSmartInputField,
  CiSmartJsonEditorField,
  CiSmartTextareaField,
  useCiFormikErrors,
  useCiMonacoTheme,
  useCiSmartFormField,

  // spinner
  CiSpinner,

  // Shadcn
  Badge,
  BorderBeam,
  Button,
  buttonVariants,
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  Checkbox,
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  Input,
  Label,
  NeonGradientCard,
  Separator,
  ScrollArea,
  ScrollBar,
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  cn,
} from "./components";

// ─────────────────────────────────────────────────────────────
// feedback
// ─────────────────────────────────────────────────────────────
export {
  // console print
  CiConsolePrint,
  ciPrintToConsole,

  // helpers
  ciNormalizeClientThrownError,

  // notify
  CI_DEFAULT_FEEDBACK_CONFIG,
  CiFeedbackHandler,
  CiFeedbackProvider,
  ciPresets,
  ciNotify,
  ciResolveFeedbackConfig,
  useCiFeedbackStore,
} from "./feedback";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export {
  // components
  CiErrorPage,
  CiPageHeader,
  CiPageHeaderActionButton,
  CiPageLoader,
  CiPageShell,

  // utils
  ciBuildBreadcrumbsFromConfig,
  useCiPageLoaderStore,
  type CiBuildBreadcrumbsFromConfigInput,

  // constants
  CI_PAGE_HEADER_SCROLL_THRESHOLD,
} from "./page";

// ─────────────────────────────────────────────────────────────
// types: components
// ─────────────────────────────────────────────────────────────
export type {
  // about border beam
  CiAboutBorderBeamProps,
  CiAboutBorderBeamResolvedProps,
  CiAboutBorderBeamViewProps,

  // dashboard
  CiDashboardCardConfig,
  CiDashboardCardProps,
  CiDashboardCardViewModel,
  CiDashboardHeaderButtonProps,
  CiDashboardIcon,
  CiDashboardPageProps,

  //data table
  CiDataTableCursorDataSource,
  CiDataTableCursorPage,
  CiDataTableCursorQuery,
  CiDataTableDataMode,
  CiDataTableAction,
  CiDataTableCursorConfig,
  CiDataTableInterface,
  CiDataTablePageCache,
  CiDataTableRowActionsMenuProps,
  CiDataTableSortSpec,

  // main menu
  CiMainMenuItem,
  CiMainMenuTarget,

  // shadcn
  BorderBeamProps,

  // smart form
  CiFormFieldCommonProps,
  CiFormFieldProps,
  CiFormInputProps,
  CiFormTextareaProps,
  CiSmartCheckboxFieldProps,
  CiSmartFormFieldContextValue,
  CiSmartFormItemContextValue,

  // spinner
  CiPageSpinnerProps,
} from "./components/types";

// ─────────────────────────────────────────────────────────────
// types: feedback
// ─────────────────────────────────────────────────────────────
export type {
  // console print
  CiConsoleLogOptions,
  CiConsolePrintInterface,
  CiPrintOutputFormat,
  CiPrintOutputType,

  // notify
  CiClientFeedbackPayload,
  CiDeliveryChannel,
  CiFeedbackHandlerProps,
  CiFeedbackLevel,
  CiFeedbackRuntimeOverrides,
  CiFeedbackSeverity,
  CiFeedbackSonnerConfig,
  CiFeedbackSonnerConfigResolved,
  CiNotifyOptions,
  CiToneTokens,
} from "./feedback/types";

// ─────────────────────────────────────────────────────────────
// types: page
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
} from "./page/types";
