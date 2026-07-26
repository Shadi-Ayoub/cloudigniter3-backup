import { headers } from "next/headers";

import { CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME, ciDeserializeRequestContext } from "@cloudigniter/core/lib";

import type { CiOrgUnitContext } from "@cloudigniter/core/types";

/**
 * Returns the canonical Org Unit context for the current server request.
 *
 * The Org Unit is read from the authoritative CiRequestContext header written
 * by the CloudIgniter proxy.
 *
 * This function does not resolve Org Units from the URL, cookies, or individual
 * Org Unit headers. Resolution must happen in the proxy layer.
 */
export async function ciGetOrgUnitContext(): Promise<CiOrgUnitContext | null> {
  const headerStore = await headers();

  const serializedRequestContext = headerStore.get(CI_DEFAULT_REQUEST_CONTEXT_HEADER_NAME);

  if (!serializedRequestContext) {
    return null;
  }

  const requestContext = ciDeserializeRequestContext(serializedRequestContext);

  if (!requestContext) {
    return null;
  }

  const { tenant, orgUnit } = requestContext;

  /**
   * An Org Unit can exist only inside a valid Tenant scope.
   */
  if (tenant.scope !== "tenant" || !tenant.id || !orgUnit || orgUnit.tenantId !== tenant.id) {
    return null;
  }

  return orgUnit;
}
