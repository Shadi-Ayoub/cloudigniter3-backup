// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export {
  useCiNextAwsAuthenticatorTheme,
  CiAwsLoginInternal,
  CiAwsLogoutButton,
  CiAwsLogin,
  CiAwsLogout,
  useCiAwsLogout,
} from "./auth";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export { CiNextLocaleSwitcher } from "./i18n";

// ─────────────────────────────────────────────────────────────
// navigation
// ─────────────────────────────────────────────────────────────
export { CiNavigateWithLoader } from "./navigation";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export { CiPage, CiBreadcrumbs } from "./page";

// ─────────────────────────────────────────────────────────────
// providers
// ─────────────────────────────────────────────────────────────
export { CiAmplifyClientConfigurer, CiAwsProfileMenu } from "./providers";

// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export {
  CiSettingsPage,
  CiSettingsProvider,
  useCiSettings,
  useCiSettingValue,
} from "./settings";

// ─────────────────────────────────────────────────────────────
// theme
// ─────────────────────────────────────────────────────────────
export { CiThemeProvider, CiThemeSwitcher } from "./theme";

// ─────────────────────────────────────────────────────────────
// ui
// ─────────────────────────────────────────────────────────────
// export {
//   // components
//   CiDashboardHeaderButton,
//   CiMenuItem,
//   CiNavigationMenu,
//   CiHeaderLogo,
//   type CiHeaderLogoProps,
//   CiProfileMenu,
//   CiProfileMenuBase,

//   // pages
//   // CiDevToolsPage,
//   CiNextAwsLoginPage,
//   CiSandboxPage,
//   CiSeederPage,
//   CiTenantsPage,
//   CiThemePresentationPage,
// } from "./ui";

// ─────────────────────────────────────────────────────────────
// wrapper
// ─────────────────────────────────────────────────────────────
export { CiClientWrapper } from "./wrapper";
