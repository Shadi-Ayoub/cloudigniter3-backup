import { CI_DEFAULT_ORG_UNIT_OPTIONS } from "@ci-core/lib";
import {
  CI_DEFAULT_REWRITE_SUBDOMAIN_TO_TENANT_PATH,
  CI_DEFAULT_TENANT_BASE_PATH,
  CI_DEFAULT_TENANT_LOOKUP_PATH,
  CI_DEFAULT_TENANT_NOT_FOUND_PATH,
  CI_DEFAULT_TENANT_ROUTING_MODE,
  CI_DEFAULT_TENANT_SUSPENDED_PATH,
  CI_DEFAULT_TENANT_URL_STRATEGY,
  CI_DEFAULT_VALIDATE_TENANT,
} from "./constants";

import type { CiTenantRoutingOptions } from "@ci-core/types";

export const CI_DEFAULT_TENANT_ROUTING_OPTIONS: Required<CiTenantRoutingOptions> = {
  enabled: false,
  mode: CI_DEFAULT_TENANT_ROUTING_MODE,
  basePath: CI_DEFAULT_TENANT_BASE_PATH,
  rewriteSubdomainToTenantPath: CI_DEFAULT_REWRITE_SUBDOMAIN_TO_TENANT_PATH,
  lookupPath: CI_DEFAULT_TENANT_LOOKUP_PATH,
  validateTenant: CI_DEFAULT_VALIDATE_TENANT,
  notFoundPath: CI_DEFAULT_TENANT_NOT_FOUND_PATH,
  suspendedPath: CI_DEFAULT_TENANT_SUSPENDED_PATH,
  infoPageStrategy: CI_DEFAULT_TENANT_URL_STRATEGY,

  rootDomains: [],
  reservedSubdomains: ["www"],
  reservedTenantSlugs: [],

  orgUnit: CI_DEFAULT_ORG_UNIT_OPTIONS,
};
