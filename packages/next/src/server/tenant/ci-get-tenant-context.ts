import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME, ciDeserializeRequestContext } from "@cloudigniter/core/lib";

import type { CiTenantContext } from "@cloudigniter/core/types";

const ciReadCurrentTenantContext = cache(async (headerName: string): Promise<CiTenantContext | null> => {
  const requestHeaders = await headers();
  const serializedContext = requestHeaders.get(headerName);

  if (!serializedContext) {
    return null;
  }

  try {
    const requestContext = ciDeserializeRequestContext(serializedContext);

    return requestContext.tenant;
  } catch {
    return null;
  }
});

/**
 * Returns the tenant context resolved by the Next.js Proxy.
 *
 * Returns null when the request-context header is missing or invalid.
 */
export function ciGetTenantContext(
  headerName = CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
): Promise<CiTenantContext | null> {
  return ciReadCurrentTenantContext(headerName);
}

/**
 * Returns the tenant context resolved by the Next.js Proxy.
 *
 * Throws when the request-context header is missing or invalid.
 */
export async function ciRequireTenantContext(
  headerName = CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME,
): Promise<CiTenantContext> {
  const tenant = await ciReadCurrentTenantContext(headerName);

  if (!tenant) {
    throw new Error("The current CiTenantContext was not resolved by the Next.js Proxy.");
  }

  return tenant;
}
