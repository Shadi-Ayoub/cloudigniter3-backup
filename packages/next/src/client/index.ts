// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export { CiNextLocaleSwitcher } from "./i18n";

// ─────────────────────────────────────────────────────────────
// navigation
// ─────────────────────────────────────────────────────────────
// export { CiNavigateWithLoader } from "./navigation";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export { CiPage, CiBreadcrumbs } from "./page";

// ─────────────────────────────────────────────────────────────
// providers
// ─────────────────────────────────────────────────────────────
export { CiAmplifyClientConfigurer } from "./providers";

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

// ─────────────────────────────────────────────────────────────
// modules
// ─────────────────────────────────────────────────────────────
export {
  // auth
  CiLogin,
  CiLogoutButton,
  CiNextAwsLogin,
  CiNextAwsLogoutButton,
  useCiNextAwsLogout,
  useCiNextAwsAuthenticatorTheme,
  ciAuthClientModule,

  // devbeacon
  CiDevBeaconClient,
  CiDevBeaconSideTabsList,
  ciDevBeaconGetTraceLogTextTab,
  CiDevBeaconTraceLogViewerText,
  CiDevBeaconTraceTab,
} from "../modules/client";
