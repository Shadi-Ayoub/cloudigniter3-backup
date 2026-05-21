// ─────────────────────────────────────────────────────────────
// components
// ─────────────────────────────────────────────────────────────
export {
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

  // dashboard
  CiDashboardCard,
  CiDashboardGrid,
  CiDashboardHeaderButton,
  CiDashboardPage,

  // locale
  CiNextLocaleSwitcher,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  type CiNextLocaleSwitcherProps,

  // mark
  CiHeaderLogo,
  type CiHeaderLogoProps,

  // main menu
  CiMainMenu,
  CiMenuItem,
  CiNavigationMenu,

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
} from "./components";

// ─────────────────────────────────────────────────────────────
// layout
// ─────────────────────────────────────────────────────────────
// export {} from "./layout";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export {
  // CiErrorPage,
  CiPage,
  // CiPageHeader,
  // CiPageHeaderActionButton,
  // CiPageLoader,
  CiBreadcrumbs,
  // ciBuildBreadcrumbsFromConfig,
  // type CiBreadcrumbItem,
  // type CiCollapsiblePageHeaderProps,
  // type CiErrorPageProps,
  type CiPageProps,
  // type CiPageSetup,
  type CiNextPageConfig,
} from "../page";

// ─────────────────────────────────────────────────────────────
// store
// ─────────────────────────────────────────────────────────────
// export { useCiPageLoaderStore } from "./store";
