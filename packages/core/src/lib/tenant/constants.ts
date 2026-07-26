import type { CiTenantMode, CiTenantScope, CiTenantInfoPageStrategy } from "@ci-core/types";

// headers
// export const CI_DEFAULT_TENANT_NAME_HEADER_NAME: string = "x-ci-tenant-name";
// export const CI_DEFAULT_TENANT_ID_HEADER_NAME: string = "x-ci-tenant-id";
// export const CI_DEFAULT_TENANT_SLUG_HEADER_NAME: string = "x-ci-tenant-slug";
// export const CI_DEFAULT_TENANT_SCOPE_HEADER_NAME: string = "x-ci-tenant-scope";
// export const CI_DEFAULT_TENANT_TYPE_HEADER_NAME: string = "x-ci-tenant-type";
// export const CI_DEFAULT_TENANT_MODE_HEADER_NAME: string = "x-ci-tenant-mode";
// export const CI_DEFAULT_TENANT_STATUS_HEADER_NAME: string =
//   "x-ci-tenant-status";
// export const CI_DEFAULT_FEATURE_PATHNAME_HEADER_NAME: string =
//   "x-ci-feature-pathname";

// export const CI_DEFAULT_TENANT_HEADERS = {
//   tenantName: CI_DEFAULT_TENANT_NAME_HEADER_NAME,
//   tenantMode: CI_DEFAULT_TENANT_MODE_HEADER_NAME,
//   tenantScope: CI_DEFAULT_TENANT_SCOPE_HEADER_NAME,
//   tenantType: CI_DEFAULT_TENANT_TYPE_HEADER_NAME,
//   tenantId: CI_DEFAULT_TENANT_ID_HEADER_NAME,
//   tenantStatus: CI_DEFAULT_TENANT_STATUS_HEADER_NAME,
//   featurePathname: CI_DEFAULT_FEATURE_PATHNAME_HEADER_NAME,
// } as const;

// cookies
// export const CI_DEFAULT_TENANT_NAME_COOKIE_NAME: string = "ci-tenant-name";
// export const CI_DEFAULT_TENANT_ID_COOKIE_NAME: string = "ci-tenant-id";
// export const CI_DEFAULT_TENANT_SCOPE_COOKIE_NAME: string = "ci-tenant-scope";
// export const CI_DEFAULT_TENANT_MODE_COOKIE_NAME: string = "ci-tenant-mode";
// export const CI_DEFAULT_TENANT_STATUS_COOKIE_NAME: string = "ci-tenant-status";
// export const CI_DEFAULT_TENANT_TYPE_COOKIE_NAME: string = "ci-tenant-type";
// export const CI_DEFAULT_FEATURE_PATHNAME_COOKIE_NAME: string =
//   "ci-feature-pathname";

// export const CI_DEFAULT_TENANT_COOKIES = {
//   tenantName: CI_DEFAULT_TENANT_NAME_COOKIE_NAME,
//   tenantMode: CI_DEFAULT_TENANT_MODE_COOKIE_NAME,
//   tenantScope: CI_DEFAULT_TENANT_SCOPE_COOKIE_NAME,
//   tenantType: CI_DEFAULT_TENANT_TYPE_COOKIE_NAME,
//   tenantId: CI_DEFAULT_TENANT_ID_COOKIE_NAME,
//   tenantStatus: CI_DEFAULT_TENANT_STATUS_COOKIE_NAME,
//   featurePathname: CI_DEFAULT_FEATURE_PATHNAME_COOKIE_NAME,
// } as const;

export const CI_DEFAULT_TENANT_ROUTING_MODE: CiTenantMode = "slug";
export const CI_DEFAULT_TENANT_BASE_PATH: string = "/t";
export const CI_DEFAULT_TENANT_ROUTING_SCOPE: CiTenantScope = "global";
export const CI_DEFAULT_TENANT_LOOKUP_PATH: string = "/ci-internal/tenant-lookup";
export const CI_DEFAULT_TENANT_NOT_FOUND_PATH: string = "/tenant-not-found";
export const CI_DEFAULT_TENANT_SUSPENDED_PATH: string = "/tenant-suspended";
export const CI_DEFAULT_TENANT_URL_STRATEGY: CiTenantInfoPageStrategy = "rewrite";
export const CI_DEFAULT_WRITE_TENANT_COOKIE: boolean = true;
export const CI_DEFAULT_REWRITE_SUBDOMAIN_TO_TENANT_PATH: boolean = true;
export const CI_DEFAULT_VALIDATE_TENANT: boolean = true;

// A shared probe manifest to provide common technical fixture identifiers used by the endpoint and mock lookups
export const CI_DEV_TENANT_RESOLUTION_PROBES = {
  tenant: {
    active: "ci-probe-tenant-6f7a2d91-active",
    suspended: "ci-probe-tenant-6f7a2d91-suspended",
    archived: "ci-probe-tenant-6f7a2d91-archived",
    missing: "ci-probe-tenant-6f7a2d91-missing",
  },

  orgUnit: {
    root: "/ci-probe-org-6f7a2d91-root",
    branch: "/ci-probe-org-6f7a2d91-root/branch-31f7",
    deep: "/ci-probe-org-6f7a2d91-root/branch-31f7/leaf-6ac0",
    suspended: "/ci-probe-org-6f7a2d91-suspended",
    archived: "/ci-probe-org-6f7a2d91-archived",
    missing: "/ci-probe-org-6f7a2d91-missing",
  },
} as const;
