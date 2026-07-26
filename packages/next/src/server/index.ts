// ─────────────────────────────────────────────────────────────
// aws
// ─────────────────────────────────────────────────────────────
export {
  ciAwsGetCurrentUser,
  ciGetAmplifyServerContext,
  ciGetNextAmplifyServerRunner,
  ciGetServerStatus,
  ciResolveNextAwsAuthMode,
} from "./aws";

// ─────────────────────────────────────────────────────────────
// context
// ─────────────────────────────────────────────────────────────
export { ciGetRequestContext } from "./context";

// ─────────────────────────────────────────────────────────────
// cookie
// ─────────────────────────────────────────────────────────────
export { ciGetCookies, ciGetNextServerCookie, ciSetNextServerCookie } from "./cookie";

// ─────────────────────────────────────────────────────────────
// dev
// ─────────────────────────────────────────────────────────────
export {
  // seeder
  ciReadMocksForItem,

  // trace
  // ciStartTraceServer,
  // CiTraceLoggerServer,
  // trace
  // type CiBuildCanonicalInput,
  // type CiCanonicalRecord,
  // type CiLogEntryType,
  // type CiMetricConfig,
  // type CiTimerRecord,
  // type CiTraceConfig,
  // type CiTraceLoggerOptions,
} from "./dev";

// ─────────────────────────────────────────────────────────────
// env
// ─────────────────────────────────────────────────────────────
export { ciGetEnvMode } from "./env";

// ─────────────────────────────────────────────────────────────
// header
// ─────────────────────────────────────────────────────────────
export { ciGetHeaders } from "./header";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export { ciGetServerLocale, ciResolveLocale, ciSetServerLocale } from "./i18n";

// ─────────────────────────────────────────────────────────────
// org unit
// ─────────────────────────────────────────────────────────────
export { ciGetOrgUnitContext, ciResolveOrgUnitContext, ciResolveOrgUnit } from "./org-unit";

// TBD
// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export { ciDeleteSettings, ciGetSettings, ciInitializeSettingsIfMissing, ciSetSettings } from "./settings";
///////

// ─────────────────────────────────────────────────────────────
// tenant
// ─────────────────────────────────────────────────────────────
export {
  ciGetTenantContext,
  ciHandleTenantLogic,
  ciResolveTenantContext,
  ciRewriteTenantRoute,
  // ciWriteTenantContext,
} from "./tenant";

// ─────────────────────────────────────────────────────────────
// modules
// ─────────────────────────────────────────────────────────────
export {
  // auth
  ciAuthServerModule,

  // devbeacon
  CiDevBeacon,
  type CiNexAwsDevBeaconProps,
} from "../modules/server";

// ─────────────────────────────────────────────────────────────
// wrapper
// ─────────────────────────────────────────────────────────────
export { CiNextRootWrapper, CiPageWrapper } from "./wrapper";
