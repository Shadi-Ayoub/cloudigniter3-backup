// ─────────────────────────────────────────────────────────────
// amplify
// ─────────────────────────────────────────────────────────────
export { appAmplifyServerClient, appWithAmplify } from "./amplify";

// ─────────────────────────────────────────────────────────────
// api
// ─────────────────────────────────────────────────────────────
export {
  appServerClient,
  getLambdaParameters,

  //Tenants
  //   getTenant,
  //   getTenantLookupBySlug,
  //   listTenants,
  //   seedTenants,

  //Settings
  //   ciGetSettings,
  //   saveSettings,

  //Seeder
  //   seed,

  // api
  appPrepareServerApiRequest,
} from "./api";

// ─────────────────────────────────────────────────────────────
// auth
// ─────────────────────────────────────────────────────────────
export { appGetDevBeaconAccess, appGetDevBeaconActor } from "./auth";

// ─────────────────────────────────────────────────────────────
// bootstrap
// ─────────────────────────────────────────────────────────────
export { appBootstrap, ciPrepareConfig, ciGetServerStatus } from "./bootstrap";

// ─────────────────────────────────────────────────────────────
// components
// ─────────────────────────────────────────────────────────────
export { Kernel } from "./components";

// ─────────────────────────────────────────────────────────────
// config
// ─────────────────────────────────────────────────────────────
export {
  // buildPageConfig,
  appGetServerCoreConfig,
  appGetAllServerConfig,
} from "./config";

// ─────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────
export {
  ciLoadRouteMessages,
  type CiLoadRouteMessagesOptions,
  type CiLoadRouteMessagesResult,
} from "./i18n";

// ─────────────────────────────────────────────────────────────
// lib
// ─────────────────────────────────────────────────────────────
export {} from "./lib";

// ─────────────────────────────────────────────────────────────
// root
// ─────────────────────────────────────────────────────────────
export {
  appResolveRootLayoutContext,
  AppRootWrapper,
  type AppRootLayoutContext,
  type AppRootWrapperProps,
} from "./root";

// ─────────────────────────────────────────────────────────────
// settings
// ─────────────────────────────────────────────────────────────
export { appGetSettings } from "./settings";

// export { getSettings } from './get-settings';
// export { getContext } from './get-context';
// export { ciGetServerStatus } from "./ci-get-server-status";
// export { ciBootstrap } from "./ci-bootstrap";
// export { getRoutes } from "./get-routes";
// export { getCurrentUserServer } from './get-server-current-user';

// export { ciGetSystemConfig } from "./ci-get-system-config";
