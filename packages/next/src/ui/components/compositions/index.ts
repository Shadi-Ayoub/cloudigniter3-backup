// ─────────────────────────────────────────────────────────────
// about border beam
// ─────────────────────────────────────────────────────────────
export {
  CiAboutBorderBeam,
  type CiAboutBorderBeamProps,
} from "./about-border-beam";

// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export {
  CiLogin,
  CiLogout,
  CiAwsLoginInternal,
  CiAwsLogoutButton,
  ciResolveAuthProvider,
  type CiAwsLoginViewProps,
  type CiAwsLogoutButtonProps,
  type CiLoginProps,
  type CiLogoutProps,
} from "./auth";

// ─────────────────────────────────────────────────────────────
// console print
// ─────────────────────────────────────────────────────────────
export { CiConsolePrint } from "./console-print";

// ─────────────────────────────────────────────────────────────
// dashboard
// ─────────────────────────────────────────────────────────────
export {
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
} from "./dashboard";

// ─────────────────────────────────────────────────────────────
// data table
// ─────────────────────────────────────────────────────────────
export {
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
} from "./data-table";

// ─────────────────────────────────────────────────────────────
// locale
// ─────────────────────────────────────────────────────────────
export {
  CiLocaleSwitcher,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  type CiLocaleSwitcherSelectProps,
} from "./locale-awitcher";

// ─────────────────────────────────────────────────────────────
// mark
// ─────────────────────────────────────────────────────────────
export { CiHeaderLogo, type CiHeaderLogoProps } from "./mark";

// ─────────────────────────────────────────────────────────────
// main menu
// ─────────────────────────────────────────────────────────────
export {
  CiMainMenu,
  CiMenuItem,
  CiNavigationMenu,
  type CiMainMenuItem,
} from "./main-menu";

// ─────────────────────────────────────────────────────────────
// main header navigation box
// ─────────────────────────────────────────────────────────────
export { CiMainHeaderNavigationBox } from "./main-header-navigation-box";

// ─────────────────────────────────────────────────────────────
// main header user box
// ─────────────────────────────────────────────────────────────
export {
  CiMainHeaderUserBox,
  type CiMainHeaderUserBoxProps,
} from "./main-header-user-box";

// ─────────────────────────────────────────────────────────────
// profile menu
// ─────────────────────────────────────────────────────────────
export {
  CiProfileMenu,
  CiProfileMenuBase,
  type CiProfileMenuItem,
  type CiProfileMenuProps,
} from "./profile-menu";

// ─────────────────────────────────────────────────────────────
// round button fallback
// ─────────────────────────────────────────────────────────────
export { CiRoundButtonFallback } from "./round-button-fallback";

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
// theme switcher
// ─────────────────────────────────────────────────────────────
export { CiThemeSwitcher, type CiThemeSwitcherProps } from "./theme-switcher";
