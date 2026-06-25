import type { NextRequest } from "next/server";

import { CI_DEFAULT_ORG_UNIT_OPTIONS } from "@cloudigniter/core/lib";

import type {
  CiResolveOrgUnitResult,
  CiTenantContext,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import { ciLookupOrgUnit, ciResolveOrgUnit } from "./helpers";

/**
 * Resolves the canonical Org Unit context for the current request.
 *
 * This function:
 * - runs only for tenant-scoped routes
 * - supports nested Org Unit paths using longest-prefix matching
 * - resolves an Org Unit through the configured lookup source
 * - returns the remaining feature pathname after removing the resolved
 *   Org Unit path
 *
 * Org Unit status enforcement is intentionally handled by
 * ciHandleTenantLogic(), where middleware can rewrite suspended or archived
 * Org Units to the appropriate informational page.
 */
export async function ciResolveOrgUnitContext({
  request,
  tenantContext,
  featurePathname,
  tenantRoutingConfig,
}: {
  request: NextRequest;
  tenantContext: CiTenantContext;
  featurePathname: string;
  tenantRoutingConfig: CiTenantRoutingOptions;
}): Promise<CiResolveOrgUnitResult> {
  const orgUnitOpts = {
    ...CI_DEFAULT_ORG_UNIT_OPTIONS,
    ...(tenantRoutingConfig.orgUnit ?? {}),
  } as Required<NonNullable<CiTenantRoutingOptions["orgUnit"]>>;

  /**
   * Org Unit resolution applies only to tenant scope.
   */
  if (
    !orgUnitOpts.enabled ||
    tenantContext.scope !== "tenant" ||
    !tenantContext.id
  ) {
    return {
      orgUnit: null,
      featurePathname,
    };
  }

  return ciResolveOrgUnit({
    tenantId: tenantContext.id,
    featurePathname,
    maxDepth: orgUnitOpts.maxDepth,

    lookupOrgUnit: (tenantId, orgUnitPath) =>
      ciLookupOrgUnit(request, tenantId, orgUnitPath, orgUnitOpts),
  });
}
