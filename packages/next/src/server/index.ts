export { ciResolveNextAwsAuthMode, ciGetNextAmplifyServerRunner } from "./aws";

export {
  ciGetCookies,
  ciGetNextServerCookie,
  ciSetNextServerCookie,
} from "./cookie";

// export {
//   CI_DEFAULT_TENANT_ROUTING_OPTIONS,
//   ciGetBypassFlag,
//   ciGetHost,
//   ciIsInternalPath,
//   ciIsStaticFile,
//   ciGetRequestPath,
//   ciHandleRouteLogic,
//   ciHandleTenantLogic,
//   ciRewriteToRouteInfoPage,
//   ciBuildTenantRewritePath,
//   ciLookupTenant,
//   ciNextProxyMatcher,
//   ciNextProxyResponse,
//   ciResolveTenant,
//   ciResolveTenantFromSlugPath,
//   ciResolveTenantFromSubdomain,
//   ciRewriteToTenantInfoPage,
// } from "./proxy";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export { ciGetServerLocale, ciResolveLocale, ciSetServerLocale } from "./i18n";

// TBD
// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export {
  ciDeleteSettings,
  ciGetSettings,
  ciInitializeSettingsIfMissing,
  ciSetSettings,
} from "./settings";
// export * from "../ui/server";
///////

// // ─────────────────────────────────────────────────────────────
// // ui
// // ─────────────────────────────────────────────────────────────
// export {
//   // dashboard
//   CiDashboardPage,

//   // dev beacon
//   CiNextAwsDevBeacon,
//   type CiNexAwsDevBeaconProps,

//   // main header navigation box
//   CiMainHeaderNavigationBox,

//   // main header user box
//   CiMainHeaderUserBox,
//   type CiMainHeaderUserBoxProps,

//   // main menu
//   CiMainMenu,
// } from "./ui";

// ─────────────────────────────────────────────────────────────
// wrapper
// ─────────────────────────────────────────────────────────────
export { CiPageWrapper, CiNextRootWrapper } from "./wrapper";
