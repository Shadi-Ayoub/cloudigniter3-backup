import type { CiNextAwsCoreConfig } from "@/kernel";

import { routes } from "./routes";

export default {
  providers: {
    aws: {
      cognito: {
        client: { region: "us-east-1" },
      },
      dynamodb: {
        clientConfig: { region: "us-east-1" },
      },
    },
  },
  app: {
    loginRoute: "/login",
    route: {
      namespaceCookieName: "ci-namespace",
      namespaceHeaderName: "x-ci-namespace",
    },
  },
  auth: {
    loginRoute: "/login",
    authUi: {
      // Merge with CI base theme or overwrite it with your custom theme
      custom: {
        merge: true,
        loadingText: "Signing you in. Please wait...",
      },
      // Rarely needed. If you over customise the Authenticator animation you may need to calibrate the first two
      // items to properly handle the loader spinning effect! the last two items are needed to identify the first
      // ever time page load!
      visibility: {
        minHeightPx: 16,
        debounceMs: 0,
        initialMountSuppressMs: 1200,
        minVisibleStableMs: 300,
      },
    },
  },
  data: {
    publicAuthMode: "public",
  },
  route: {
    namespaceCookieName: "ci-route-namespace",
    namespaceHeaderName: "x-ci-route-namespace",
    pathnameCookieName: "ci-route-pathname",
    pathnameHeaderName: "x-ci-route-pathname",
    infoPageStrategy: "rewrite",
  },
  // cognito: { client: { region: "us-east-1" } },
  // dynamodb: {
  //   clientConfig: {
  //     region: "us-east-1",
  //   },
  // },
  i18n: {
    locales: [
      { code: "en", name: "english" },
      { code: "ar", name: "arabic" },
    ],
    cookieName: "ci-locale",
    defaultLocale: "en",
  },
  theme: {
    enableSystem: true,
    // themeDir: "",
    storageKey: "ci-theme",
  },
  tenant: {
    enabled: true,
    // Routing mode: default to slug-based (/t/:tenant/...)
    mode: "slug",

    // Base path for slug routing ('' means root-based, e.g. /acme/dashboard)
    basePath: "/t",

    // Headers names used by middleware and server components
    idHeaderName: "x-ci-tenant-id",
    modeHeaderName: "x-ci-tenant-mode", // "slug" | "subdomain"
    scopeHeaderName: "x-ci-tenant-scope", // 'system' | 'global' | 'tenant'
    statusHeaderName: "x-ci-tenant-status", // 'active' | 'suspended' | 'archived'

    // Cookies names used by middleware and server components
    idCookieName: "ci-tenant-id",
    modeCookieName: "ci-tenant-mode", // "slug" | "subdomain"
    scopeCookieName: "ci-tenant-scope", // 'system' | 'global' | 'tenant'
    statusCookieName: "ci-tenant-status", // 'active' | 'suspended' | 'archived'

    // Persist resolved tenant in a cookie (useful for server components / RSC)
    writeTenantCookie: true,

    // Only relevant when mode === 'subdomain'
    // If true, rewrite foo.example.com → /foo internally
    rewriteSubdomainToTenantPath: true,

    // Domains considered “root” when using subdomains
    // e.g. example.com, example.ae
    rootDomains: ["http://localhost:3000/"],

    // Reserved subdomains that must never be treated as tenants
    // e.g. www, admin, app, api
    reservedSubdomains: ["www", "admin", "app", "api"],

    // Slugs that are not valid tenant identifiers
    // e.g. login, logout, dashboard, ci-internal
    reservedTenantSlugs: ["login", "logout", "ci-internal"],

    /**
     * Internal lookup endpoint used by middleware to validate tenant existence/status.
     * MUST be excluded from middleware matching.
     */
    lookupPath: "/ci-internal/tenant-lookup",

    /**
     * If true, middleware validates tenant existence & status
     * using the lookup endpoint.
     */
    validateTenant: false,

    /**
     * Route shown when tenant does not exist.
     * This is rewritten/redirected to by middleware.
     */
    notFoundPath: "/tenant/not-found",

    /**
     * Route shown when tenant exists but is suspended.
     */
    suspendedPath: "/tenant/suspended",

    /**
     * How middleware sends the user to info pages.
     * - rewrite: keep original URL (recommended)
     * - redirect: change URL in browser
     */
    infoPageStrategy: "rewrite",
  },
  routes,
  dev: {
    debug: { enabled: true },
    traceLog: {
      enabled: true,
      truncRate: 0.5,
      filePath: "/tmp/ci-trace.log",
      endPoint: "/ci-internal/trace-append",
      metrics: {
        duration: true,
      },
      debug: false,
    },
  },
} satisfies CiNextAwsCoreConfig;
