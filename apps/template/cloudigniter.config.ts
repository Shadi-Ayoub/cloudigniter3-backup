import type { CiNextAwsCoreConfig } from "@/kernel/types";

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
    featurePathnameHeaderName: "x-ci-feature-pathname",

    // Cookies names used by middleware and server components
    idCookieName: "ci-tenant-id",
    modeCookieName: "ci-tenant-mode", // "slug" | "subdomain"
    scopeCookieName: "ci-tenant-scope", // 'system' | 'global' | 'tenant'
    statusCookieName: "ci-tenant-status", // 'active' | 'suspended' | 'archived'
    featurePathnameCookieName: "ci-feature-pathname",

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

    orgUnit: {
      enabled: true,

      idHeaderName: "x-ci-org-unit-id",
      slugHeaderName: "x-ci-org-unit-slug",
      pathHeaderName: "x-ci-org-unit-path",
      statusHeaderName: "x-ci-org-unit-status",

      idCookieName: "ci-org-unit-id",
      slugCookieName: "ci-org-unit-slug",
      pathCookieName: "ci-org-unit-path",
      statusCookieName: "ci-org-unit-status",

      writeOrgUnitCookie: true,

      lookupPath: "/ci-internal/org-unit-lookup",
      enforceStatus: true,

      suspendedPath: "/org-unit/suspended",

      maxDepth: 5,
    },
  },
  routes,
  dev: {
    debug: {
      debugProbe: {
        enabled: true,
      },
      devBeacon: {
        enabled: true,

        /**
         * Keep false until Attribute Role-based Access Control is implemented.
         *
         * When true, production access still requires an authenticated user
         * with the DEVELOPER role.
         */
        allowProduction: false,

        requiredRoles: ["DEVELOPER"],
      },
    },
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
