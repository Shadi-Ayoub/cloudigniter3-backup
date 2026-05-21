import type {
  CiTenantRoutingMode,
  CiTenantScope,
  CiTenantUrlStrategy,
} from "@/types";

export const CI_DEFAULT_TENANT_ID_HEADER_NAME: string = "x-ci-tenant-id";
export const CI_DEFAULT_TENANT_SCOPE_HEADER_NAME: string = "x-ci-tenant-scope";
export const CI_DEFAULT_TENANT_MODE_HEADER_NAME: string = "x-ci-tenant-mode";
export const CI_DEFAULT_TENANT_STATUS_HEADER_NAME: string =
  "x-ci-tenant-status";

export const CI_DEFAULT_TENANT_ID_COOKIE_NAME: string = "ci-tenant-id";
export const CI_DEFAULT_TENANT_SCOPE_COOKIE_NAME: string = "ci-tenant-scope";
export const CI_DEFAULT_TENANT_MODE_COOKIE_NAME: string = "ci-tenant-mode";
export const CI_DEFAULT_TENANT_STATUS_COOKIE_NAME: string = "ci-tenant-status";

export const CI_DEFAULT_TENANT_HEADERS = {
  tenantMode: CI_DEFAULT_TENANT_MODE_HEADER_NAME,
  tenantScope: CI_DEFAULT_TENANT_SCOPE_HEADER_NAME,
  tenantId: CI_DEFAULT_TENANT_ID_HEADER_NAME,
  tenantStatus: CI_DEFAULT_TENANT_STATUS_HEADER_NAME,
} as const;

export const CI_DEFAULT_TENANT_COOKIES = {
  tenantMode: CI_DEFAULT_TENANT_MODE_COOKIE_NAME,
  tenantScope: CI_DEFAULT_TENANT_SCOPE_COOKIE_NAME,
  tenantId: CI_DEFAULT_TENANT_ID_COOKIE_NAME,
  tenantStatus: CI_DEFAULT_TENANT_STATUS_COOKIE_NAME,
} as const;

export const CI_DEFAULT_TENANT_ROUTING_MODE: CiTenantRoutingMode = "slug";
export const CI_DEFAULT_TENANT_BASE_PATH: string = "/t";
export const CI_DEFAULT_TENANT_ROUTING_SCOPE: CiTenantScope = "global";
export const CI_DEFAULT_TENANT_LOOKUP_PATH: string =
  "/ci-internal/tenant-lookup";
export const CI_DEFAULT_TENANT_NOT_FOUND_PATH: string = "/tenant-not-found";
export const CI_DEFAULT_TENANT_SUSPENDED_PATH: string = "/tenant-suspended";
export const CI_DEFAULT_TENANT_URL_STRATEGY: CiTenantUrlStrategy = "rewrite";
export const CI_DEFAULT_WRITE_TENANT_COOKIE: boolean = true;
export const CI_DEFAULT_REWRITE_SUBDOMAIN_TO_TENANT_PATH: boolean = true;
export const CI_DEFAULT_VALIDATE_TENANT: boolean = true;
