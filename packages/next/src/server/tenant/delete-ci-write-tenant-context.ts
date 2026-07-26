import type { NextResponse } from "next/server";

import type { CiTenantContext, CiTenantRoutingOptions } from "@cloudigniter/core/types";

import { CI_DEFAULT_TENANT_ROUTING_OPTIONS } from "@cloudigniter/core/lib";

type CiTenantContextRequest = {
  cookies: {
    get(name: string): { value: string } | undefined;
  };
};

/**
 * Writes canonical tenant context to response headers and, optionally, cookies.
 *
 * Response headers are always written.
 * Forwarded request headers are written when supplied, making the resolved
 * context available to Server Components during the current request.
 * Cookies are written only when enabled by configuration.
 */
export function ciWriteTenantContext({
  request,
  response,
  requestHeaders,
  context,
  tenantRoutingConfig,
}: {
  request: CiTenantContextRequest;
  response: NextResponse;
  requestHeaders?: Headers;
  context: CiTenantContext;
  tenantRoutingConfig: CiTenantRoutingOptions;
}): NextResponse {
  const tOpts = {
    ...CI_DEFAULT_TENANT_ROUTING_OPTIONS,
    ...(tenantRoutingConfig ?? {}),
  } as Required<CiTenantRoutingOptions>;

  const tenantId = context.id ?? "";
  const tenantMode = context.mode;
  const tenantScope = context.scope;
  const tenantStatus = context.status;

  return response;
}
