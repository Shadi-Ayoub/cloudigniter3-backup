// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export {
  CiLogin,
  CiLogout,
  CiAwsLoginInternal,
  CiAwsLogoutButton,
  ciResolveAuthProvider,
  type CiAuthenticatorConfig,
  type CiAwsLoginViewProps,
  type CiAwsLogoutButtonProps,
  type CiLoginProps,
  type CiLogoutProps,
} from "./auth";

// ─────────────────────────────────────────────────────────────
// config
// ─────────────────────────────────────────────────────────────
export { type CiNextConfig, type CiNextResolvedConfig } from "./config";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export { CiNextLocaleSwitcher, type CiNextLocaleSwitcherProps } from "./i18n";

// ─────────────────────────────────────────────────────────────
// layout
// ─────────────────────────────────────────────────────────────
// Direct import access since it is dynamic!!!!!

// ─────────────────────────────────────────────────────────────
// navigation
// ─────────────────────────────────────────────────────────────
export {
  ciIsExternalHref,
  CiNavigateWithLoader,
  type CiNavigateWithLoaderProps,
} from "./navigation";

// ─────────────────────────────────────────────────────────────
// page
// ─────────────────────────────────────────────────────────────
export {
  CiPage,
  CiBreadcrumbs,
  type CiNextPageSetup,
  type CiPageProps,
  type CiNextPageConfig,
} from "./page";

// ─────────────────────────────────────────────────────────────
// providers
// ─────────────────────────────────────────────────────────────
export {
  // aws
  CiAmplifyClientConfigurer,
  useCiLogout,
  type CiUseLogoutOptions,
  type CiUseLogoutResult,
} from "./providers";

// ─────────────────────────────────────────────────────────────
// status
// ─────────────────────────────────────────────────────────────
export { type CiSystemStatusCheckList } from "./status";

// ─────────────────────────────────────────────────────────────
// theme
// ─────────────────────────────────────────────────────────────
export {
  ciMapThemeConfigToNextThemeProviderProps,
  ciResolveNextThemeProviderProps,
  CiThemeProvider,
  type CiThemeProviderConfig,
  type CiNextThemeConfig,
  type CiThemeProviderProps,
} from "./theme";
