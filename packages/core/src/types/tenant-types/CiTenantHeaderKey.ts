import { CI_DEFAULT_TENANT_HEADERS } from "@ci-core/lib";

export type CiTenantHeaderKey =
  (typeof CI_DEFAULT_TENANT_HEADERS)[keyof typeof CI_DEFAULT_TENANT_HEADERS];
