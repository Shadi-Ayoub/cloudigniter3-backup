// ─────────────────────────────────────────────────────────────
// config
// ─────────────────────────────────────────────────────────────
export { type CiNextResolvedConfig } from "./config";

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

// ─────────────────────────────────────────────────────────────
// trace
// ─────────────────────────────────────────────────────────────
export { ciStartTrace } from "./trace";
