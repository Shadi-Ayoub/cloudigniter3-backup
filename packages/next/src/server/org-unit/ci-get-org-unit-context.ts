import { cookies, headers } from "next/headers";

import { CI_DEFAULT_ORG_UNIT_OPTIONS } from "@cloudigniter/core/lib";

import type {
  CiOrgUnitContext,
  CiOrgUnitRoutingOptions,
  CiOrgUnitStatus,
  CiTenantContext,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

/**
 * Returns the canonical Org Unit context for the current server request.
 *
 * Resolution order:
 * 1. Request headers written by proxy/middleware.
 * 2. Org Unit cookies written by proxy/middleware.
 * 3. Null when no valid Org Unit context exists.
 *
 * This function does not resolve Org Units from the URL.
 * Org Unit pathname resolution must happen in the proxy layer.
 *
 * An Org Unit can only exist inside a valid Tenant scope. Therefore, callers
 * must provide the already-resolved Tenant context from ciGetTenantContext().
 */
export async function ciGetOrgUnitContext({
  tenantContext,
  tenantRoutingConfig,
}: {
  tenantContext: CiTenantContext;
  tenantRoutingConfig?: CiTenantRoutingOptions;
}): Promise<CiOrgUnitContext | null> {
  const orgUnitOpts = {
    ...CI_DEFAULT_ORG_UNIT_OPTIONS,
    ...(tenantRoutingConfig?.orgUnit ?? {}),
  } as Required<CiOrgUnitRoutingOptions>;

  /**
   * Org Unit context is valid only inside a resolved Tenant scope.
   */
  if (
    !orgUnitOpts.enabled ||
    tenantContext.scope !== "tenant" ||
    !tenantContext.id
  ) {
    return null;
  }

  const headerStore = await headers();
  const cookieStore = await cookies();

  const rawId =
    headerStore.get(orgUnitOpts.idHeaderName) ??
    cookieStore.get(orgUnitOpts.idCookieName)?.value ??
    undefined;

  /**
   * A missing Org Unit id means this is a Tenant-level route rather than an
   * Org Unit-scoped route.
   */
  if (!rawId) {
    return null;
  }

  const rawSlug =
    headerStore.get(orgUnitOpts.slugHeaderName) ??
    cookieStore.get(orgUnitOpts.slugCookieName)?.value ??
    undefined;

  const rawPath =
    headerStore.get(orgUnitOpts.pathHeaderName) ??
    cookieStore.get(orgUnitOpts.pathCookieName)?.value ??
    undefined;

  const rawStatus =
    headerStore.get(orgUnitOpts.statusHeaderName) ??
    cookieStore.get(orgUnitOpts.statusCookieName)?.value ??
    undefined;

  /**
   * Fail closed when the forwarded Org Unit context is incomplete or malformed.
   *
   * This prevents authorization or scoped-setting code from operating against
   * a partially reconstructed Org Unit context.
   */
  if (!rawSlug || !rawPath || !ciIsOrgUnitStatus(rawStatus)) {
    return null;
  }

  return {
    id: rawId,
    tenantId: tenantContext.id,
    slug: rawSlug,
    path: rawPath,
    status: rawStatus,
  };
}

/**
 * Determines whether a value is a valid Org Unit operational status.
 */
function ciIsOrgUnitStatus(
  value: string | undefined,
): value is CiOrgUnitStatus {
  return value === "active" || value === "suspended" || value === "archived";
}
