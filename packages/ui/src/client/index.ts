// ─────────────────────────────────────────────────────────────
// components
// ─────────────────────────────────────────────────────────────
export {
  // about border beam
  CiAboutBorderBeam,

  // code editor
  CiCodeEditor,
  type CiCodeEditorContentSerializer,
  type CiCodeEditorProps,
  type CiCodeEditorSerializationContext,

  // dashboard
  CiDashboardCard,
  CiDashboardHeaderButton,
  ciResolveDashboardCardViewModels,
  ciResolveDashboardIcon,

  // data table
  CiDataTable,
  CiDataTableRowActionsMenu,
  buildDataTableColumnsWithActions,

  // dev beacon
  // CiDevBeaconClient,
  // CiDevBeaconSideTabsList,
  // CiDevBeaconWrapper,
  // ciDevBeaconGetTraceLogTextTab,
  // CiDevBeaconTraceLogViewerText,
  // CiDevBeaconTraceTab,

  // locale switcher
  CiLocaleSwitcher,

  // main menu
  CiMenuItem,
  CiNavigationMenu,

  // mark
  CiHeaderLogo,
  type CiHeaderLogoProps,

  // profile menu
  CiProfileMenu,

  // tooltip balloon
  CiTooltipBalloon,
  type CiTooltipBalloonColor,
  type CiTooltipBalloonProps,

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

  // shadcn
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
  Badge,
  BorderBeam,
  // type BorderBeamProps,
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

  // spinners
  CiSpinner,
} from "./components";

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
export {
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

  //notify
  type CiClientFeedbackPayload,
  type CiDeliveryChannel,
  type CiFeedbackHandlerProps,
  type CiFeedbackLevel,
  type CiFeedbackRuntimeOverrides,
  type CiFeedbackSeverity,
  type CiFeedbackSonnerConfig,
  type CiFeedbackSonnerConfigResolved,
  type CiNotifyOptions,
  type CiToneTokens,
} from "./feedback";

// ─────────────────────────────────────────────────────────────
// navigation
// ─────────────────────────────────────────────────────────────
export { CiNavigateWithLoader } from "./navigation";

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
// pages
// ─────────────────────────────────────────────────────────────
// export {
//   // CiDevToolsPage,
//   CiNextAwsLoginPage,
//   CiSandboxPage,
//   CiSeederPage,
//   CiTenantsPage,
//   CiThemePresentationPage,
// } from "./pages";
