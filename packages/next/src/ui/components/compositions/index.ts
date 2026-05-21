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
} from "../../../auth";

// ─────────────────────────────────────────────────────────────
// dashboard
// ─────────────────────────────────────────────────────────────
export {
  CiDashboardCard,
  CiDashboardGrid,
  CiDashboardHeaderButton,
  CiDashboardPage,
} from "./dashboard";

// ─────────────────────────────────────────────────────────────
// locale
// ─────────────────────────────────────────────────────────────
export {
  CiNextLocaleSwitcher,
  CI_DEFAULT_LOCALE_COOKIE_NAME,
  type CiNextLocaleSwitcherProps,
} from "./locale-switcher";

// ─────────────────────────────────────────────────────────────
// mark
// ─────────────────────────────────────────────────────────────
export { CiHeaderLogo, type CiHeaderLogoProps } from "./mark";

// ─────────────────────────────────────────────────────────────
// main menu
// ─────────────────────────────────────────────────────────────
export { CiMainMenu, CiMenuItem, CiNavigationMenu } from "./main-menu";

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
// theme switcher
// ─────────────────────────────────────────────────────────────
export { CiThemeSwitcher, type CiThemeSwitcherProps } from "./theme-switcher";
