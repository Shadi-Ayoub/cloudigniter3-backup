import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME, ciDeserializeRequestContext } from "@cloudigniter/core/lib";

import type { CiRoute } from "@cloudigniter/core/types";

const ciReadCurrentRoute = cache(async (headerName: string): Promise<CiRoute | null> => {
  const requestHeaders = await headers();
  const serializedContext = requestHeaders.get(headerName);

  if (!serializedContext) {
    return null;
  }

  try {
    const requestContext = ciDeserializeRequestContext(serializedContext);

    return requestContext.route;
  } catch {
    return null;
  }
});

/**
 * Returns the current route resolved by the Next.js Proxy,
 * or null when it is missing, unresolved, or invalid.
 */
export function ciGetCurrentRoute(headerName = CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME): Promise<CiRoute | null> {
  return ciReadCurrentRoute(headerName);
}

/**
 * Returns the current route resolved by the Next.js Proxy.
 *
 * Throws when the request context is missing, invalid, or does not
 * contain a resolved route.
 */
export async function ciRequireCurrentRoute(headerName = CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME): Promise<CiRoute> {
  const route = await ciReadCurrentRoute(headerName);

  if (!route) {
    throw new Error("The current CiRoute was not resolved by the Next.js Proxy.");
  }

  return route;
}
