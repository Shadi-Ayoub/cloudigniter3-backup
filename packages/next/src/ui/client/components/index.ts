// ─────────────────────────────────────────────────────────────
// about border beam
// ─────────────────────────────────────────────────────────────
export {
  CiAboutBorderBeam,
  // type CiAboutBorderBeamProps,
} from "./about-border-beam";

// ─────────────────────────────────────────────────────────────
// dashboard
// ─────────────────────────────────────────────────────────────
export {
  CiDashboardHeaderButton,
  ciResolveDashboardCardViewModels,
  ciResolveDashboardIcon,
  // type CiDashboardCardConfig,
  // type CiDashboardCardProps,
  // type CiDashboardCardViewModel,
  // type CiDashboardHeaderButtonProps,
  // type CiDashboardIcon,
  // type CiDashboardPageProps,
} from "./dashboard";

// ─────────────────────────────────────────────────────────────
// data table
// ─────────────────────────────────────────────────────────────
export {
  CiDataTable,
  CiDataTableRowActionsMenu,
  buildDataTableColumnsWithActions,
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
} from "./data-table";

// ─────────────────────────────────────────────────────────────
// dev beacon
// ─────────────────────────────────────────────────────────────
export {
  CiDevBeaconClient,
  CiDevBeaconSideTabsList,
  CiDevBeaconWrapper,
  ciDevBeaconGetTraceLogTextTab,
  CiDevBeaconTraceLogViewerText,
  CiDevBeaconTraceTab,
} from "./dev-beacon";

// ─────────────────────────────────────────────────────────────
// locale switcher
// ─────────────────────────────────────────────────────────────
export { CiLocaleSwitcher } from "./locale-switcher";

// ─────────────────────────────────────────────────────────────
// main menu
// ─────────────────────────────────────────────────────────────
// export type { CiMainMenuItem, CiMainMenuTarget } from "./main-menu";

// ─────────────────────────────────────────────────────────────
// main menu
// ─────────────────────────────────────────────────────────────
export { CiMenuItem, CiNavigationMenu } from "./main-menu";

// ─────────────────────────────────────────────────────────────
// mark
// ─────────────────────────────────────────────────────────────
export { CiHeaderLogo, type CiHeaderLogoProps } from "./mark";

// ─────────────────────────────────────────────────────────────
// profile menu
// ─────────────────────────────────────────────────────────────
export { CiProfileMenu, CiProfileMenuBase } from "./profile-menu";

// ─────────────────────────────────────────────────────────────
// smart form
// ─────────────────────────────────────────────────────────────
export {
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
} from "./smart-form";

// ─────────────────────────────────────────────────────────────
// shadcn
// ─────────────────────────────────────────────────────────────
export {
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
} from "./shadcn";

// ─────────────────────────────────────────────────────────────
// spinner
// ─────────────────────────────────────────────────────────────
export { CiSpinner } from "./spinners";

// ─────────────────────────────────────────────────────────────
// types
// ─────────────────────────────────────────────────────────────
export type {
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

  // data table
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
  //   CiMainMenuItem,
  //   CiMainMenuTarget,

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
} from "./types";
