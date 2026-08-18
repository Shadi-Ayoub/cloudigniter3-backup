// ─────────────────────────────────────────────────────────────
// about border beam
// ─────────────────────────────────────────────────────────────
export { CiAboutBorderBeam } from "./about-border-beam";

// ─────────────────────────────────────────────────────────────
// code editor
// ─────────────────────────────────────────────────────────────
export {
  CiCodeEditor,
  type CiCodeEditorContentSerializer,
  type CiCodeEditorProps,
  type CiCodeEditorSerializationContext,
} from "./code-editor";

// ─────────────────────────────────────────────────────────────
// dashboard
// ─────────────────────────────────────────────────────────────
export {
  CiDashboardCard,
  CiDashboardHeaderButton,
  ciResolveDashboardCardViewModels,
  ciResolveDashboardIcon,
} from "./dashboard";

// ─────────────────────────────────────────────────────────────
// data entity manager
// ─────────────────────────────────────────────────────────────
export { CiDataEntityManager } from "./data-entity-manager";

// ─────────────────────────────────────────────────────────────
// data table
// ─────────────────────────────────────────────────────────────
export {
  CiDataTable,
  CiDataTableRecordInformationDialog,
  type CiDataTableRecordInformationDialogProps,
  CiDataTableRowActions,
  CiDataTableRowActionsMenu,
  buildDataTableColumnsWithActions,
  ciBuildDataTableExcelWorkbook,
  ciClearDataTablePreferences,
  ciCreateDataTableDataSource,
  ciDefineDataTable,
  ciDefineDataTableColumn,
  ciExportDataTableToExcel,
  ciGetDataTablePreferenceCookieName,
  ciIsDataTableControlDisabled,
  ciIsDataTableControlVisible,
  ciLoadDataTablePreferences,
  ciSaveDataTablePreferences,
} from "./data-table";

// ─────────────────────────────────────────────────────────────
// dev beacon
// ─────────────────────────────────────────────────────────────
// export {
//   CiDevBeaconClient,
//   CiDevBeaconSideTabsList,
//   CiDevBeaconWrapper,
//   ciDevBeaconGetTraceLogTextTab,
//   CiDevBeaconTraceLogViewerText,
//   CiDevBeaconTraceTab,
// } from "./dev-beacon";

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
export { CiProfileMenu } from "./profile-menu";

// ─────────────────────────────────────────────────────────────
// tooltip balloon
// ─────────────────────────────────────────────────────────────
export {
  CiTooltipBalloon,
  type CiTooltipBalloonColor,
  type CiTooltipBalloonProps,
} from "./tooltip-balloon";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
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
} from "./shadcn";

// ─────────────────────────────────────────────────────────────
// spinner
// ─────────────────────────────────────────────────────────────
export { CiSpinner } from "./spinners";

// ─────────────────────────────────────────────────────────────
// types
// ─────────────────────────────────────────────────────────────
// export type {
//   CiAboutBorderBeamProps,
//   CiAboutBorderBeamResolvedProps,
//   CiAboutBorderBeamViewProps,

//   // dashboard
//   CiDashboardCardConfig,
//   CiDashboardCardProps,
//   CiDashboardCardViewModel,
//   CiDashboardHeaderButtonProps,
//   CiDashboardIcon,
//   CiDashboardPageProps,

//   // data table
//   CiDataTableCursorDataSource,
//   CiDataTableCursorPage,
//   CiDataTableCursorQuery,
//   CiDataTableDataMode,
//   CiDataTableAction,
//   CiDataTableCursorConfig,
//   CiDataTableInterface,
//   CiDataTablePageCache,
//   CiDataTableRowActionsMenuProps,
//   CiDataTableSortSpec,

//   // main menu
//   //   CiMainMenuItem,
//   //   CiMainMenuTarget,

//   // shadcn
//   BorderBeamProps,

//   // smart form
//   CiFormFieldCommonProps,
//   CiFormFieldProps,
//   CiFormInputProps,
//   CiFormTextareaProps,
//   CiSmartCheckboxFieldProps,
//   CiSmartFormFieldContextValue,
//   CiSmartFormItemContextValue,

//   // spinner
//   CiPageSpinnerProps,
// } from "./types";
