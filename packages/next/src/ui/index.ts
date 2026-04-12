// ─────────────────────────────────────────────────────────────
// components
// ─────────────────────────────────────────────────────────────
export {
  // about border beam
  CiAboutBorderBeam,
  type CiAboutBorderBeamProps,

  // auth
  CiLogin,
  CiLogout,
  CiAwsLoginInternal,
  CiAwsLogoutButton,
  ciResolveAuthProvider,
  type CiAwsLoginViewProps,
  type CiAwsLogoutButtonProps,
  type CiLoginProps,
  type CiLogoutProps,

  // console print
  CiConsolePrint,

  // dashboard
  CiDashboardCard,
  CiDashboardGrid,
  CiDashboardHeaderButton,
  CiDashboardPage,
  ciResolveDashboardCardViewModels,
  ciResolveDashboardIcon,
  type CiDashboardCardConfig,
  type CiDashboardCardProps,
  type CiDashboardCardViewModel,
  type CiDashboardHeaderButtonProps,
  type CiDashboardIcon,
  type CiDashboardPageProps,

  // data table
  CiDataTable,
  CiRowActionsMenu,
  buildColumnsWithActions,
  type CiCursorDataSource,
  type CiCursorPage,
  type CiCursorQuery,
  type CiDataMode,
  type CiDataTableAction,
  type CiDataTableCursorConfig,
  type CiDataTableInterface,
  type CiPageCache,
  type CiRowActionsMenuProps,
  type CiSortSpec,

  // locale
  CiLocaleSwitcher,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  type CiLocaleSwitcherSelectProps,

  // mark
  CiHeaderLogo,
  type CiHeaderLogoProps,

  // main menu
  CiMainMenu,
  CiMenuItem,
  CiNavigationMenu,
  type CiMainMenuItem,

  // main header navigation box
  CiMainHeaderNavigationBox,

  // main header user box
  CiMainHeaderUserBox,
  type CiMainHeaderUserBoxProps,

  // profile menu
  CiProfileMenu,
  CiProfileMenuBase,
  type CiProfileMenuItem,
  type CiProfileMenuProps,

  // round button fallback
  CiRoundButtonFallback,

  // theme switcher
  CiThemeSwitcher,
  type CiThemeSwitcherProps,

  // spinner
  CiSpinner,

  // Shadcn
  Badge,
  BorderBeam,
  type BorderBeamProps,
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
  ciDefaultFeedbackConfig,
  ciPresetFor,
  ciNotify,
  ciResolveFeedbackConfig,
  type CiClientFeedbackPayload,
  type CiDeliveryChannel,
  type CiFeedbackLevel,
  type CiFeedbackRuntimeOverrides,
  type CiFeedbackSeverity,
  type CiFeedbackSonnerConfig,
  type CiFeedbackSonnerConfigResolved,
  type CiNotifyOptions,
  type CiToneTokens,
} from "./feedback";

// ─────────────────────────────────────────────────────────────
// layout
// ─────────────────────────────────────────────────────────────
export {} from "./layout";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export {
  CiErrorPage,
  CiPage,
  CiPageHeader,
  CiPageHeaderActionButton,
  CiPageLoader,
  CiBreadcrumbs,
  ciBuildBreadcrumbsFromConfig,
  type CiBreadcrumbItem,
  type CiCollapsiblePageHeaderProps,
  type CiErrorPageProps,
  type CiPageProps,
  type CiPageSetup,
  type CiResolvedPageConfig,
} from "./page";

// ─────────────────────────────────────────────────────────────
// store
// ─────────────────────────────────────────────────────────────
export { useCiFeedbackStore, useCiPageLoaderStore } from "./store";
