import {
  CI_DEFAULT_FEATURE_PATHNAME_HEADER_NAME,
  CI_DEFAULT_ORG_UNIT_PATH_HEADER_NAME,
  CI_DEFAULT_TENANT_ID_HEADER_NAME,
  CI_DEFAULT_TENANT_MODE_HEADER_NAME,
  CI_DEFAULT_TENANT_NAME_HEADER_NAME,
  CI_DEFAULT_TENANT_SCOPE_HEADER_NAME,
  CI_DEFAULT_TENANT_SLUG_HEADER_NAME,
  CI_DEFAULT_TENANT_STATUS_HEADER_NAME,
  CI_DEFAULT_TENANT_TYPE_HEADER_NAME,
  ciNormalizeTenantScope,
} from "@ci-core/lib";

import {
  ciReadForwardedCookies,
  ciReadForwardedHeaders,
} from "@ci-core/server";

import type {
  CiDevBeaconProps,
  CiDevBeaconTenantInfo,
  CiTenantMode,
} from "@ci-core/types";

/**
 * Reads the resolved routing context emitted by proxy/middleware.
 * Adjust header names to match your middleware conventions.
 */
export function ciReadTenantFromHeaders(
  requestHeaders: Headers,
  requestCookies: {
    getAll(): Array<{
      name: string;
      value: string;
    }>;
  },
): CiDevBeaconTenantInfo {
  return {
    id: requestHeaders.get(CI_DEFAULT_TENANT_ID_HEADER_NAME) ?? undefined,
    slug: requestHeaders.get(CI_DEFAULT_TENANT_SLUG_HEADER_NAME) ?? undefined,
    name: requestHeaders.get(CI_DEFAULT_TENANT_NAME_HEADER_NAME) ?? undefined,
    status:
      requestHeaders.get(CI_DEFAULT_TENANT_STATUS_HEADER_NAME) ?? undefined,
    type: requestHeaders.get(CI_DEFAULT_TENANT_TYPE_HEADER_NAME) ?? undefined,
    scope: ciNormalizeTenantScope(
      requestHeaders.get(CI_DEFAULT_TENANT_SCOPE_HEADER_NAME),
    ),
    mode: requestHeaders.get(CI_DEFAULT_TENANT_MODE_HEADER_NAME) as
      | CiTenantMode
      | undefined,
    orgUnitPath:
      requestHeaders.get(CI_DEFAULT_ORG_UNIT_PATH_HEADER_NAME) ?? undefined,
    featurePathname:
      requestHeaders.get(CI_DEFAULT_FEATURE_PATHNAME_HEADER_NAME) ?? undefined,
    forwardedHeaders: ciReadForwardedHeaders(requestHeaders),
    forwardedCookies: ciReadForwardedCookies(requestCookies),
    source: "headers",
  };
}
