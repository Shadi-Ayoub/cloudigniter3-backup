import { CI_DEFAULT_ORG_UNIT_OPTIONS } from "@cloudigniter/core/lib";

import type {
  CiOrgUnitContext,
  CiOrgUnitRoutingOptions,
  CiTenantContext,
  CiTenantRoutingOptions,
} from "@cloudigniter/core/types";

import { ciResolveOrgUnitContext } from "@ci-next/server";

import { ciResolveTenantContext } from "./ci-resolve-tenant-context";

type CiTenantRequest = Pick<Request, "headers" | "url"> & {
  cookies: {
    get(name: string): { value: string } | undefined;
  };
};

interface CiHandleTenantLogicParams {
  request: CiTenantRequest;
  pathnameNormalized: string;

  /**
   * Tenant-routing options after top-level defaults have been applied.
   */
  tenantRoutingOptions: Required<CiTenantRoutingOptions>;
}

interface CiTenantLogicBaseResult {
  tenant: CiTenantContext;
  orgUnit: CiOrgUnitContext | null;

  /**
   * Logical application pathname after removing Tenant and resolved Org Unit
   * transport segments.
   */
  featurePathname: string;
}

type CiHandleTenantLogicResult =
  | (CiTenantLogicBaseResult & {
      action: "info";

      /**
       * Internal Tenant or Org Unit information-page pathname.
       */
      infoPagePath: string;
    })
  | (CiTenantLogicBaseResult & {
      action: "continue";
    });

/**
 * Resolves the Tenant and optional Org Unit associated with a request.
 *
 * This function performs resolution and status evaluation only. It does not
 * create responses or persist individual Tenant or Org Unit values. Response
 * construction and serialized CiRequestContext transport are owned by
 * ciNextProxyResponse().
 */
export async function ciHandleTenantLogic({
  request,
  pathnameNormalized,
  tenantRoutingOptions,
}: CiHandleTenantLogicParams): Promise<CiHandleTenantLogicResult> {
  const orgUnitOptions = {
    ...CI_DEFAULT_ORG_UNIT_OPTIONS,
    ...(tenantRoutingOptions.orgUnit ?? {}),
  } as Required<CiOrgUnitRoutingOptions>;

  /**
   * Tenant resolution owns removal of the external Tenant or Global routing
   * prefix. The resulting feature pathname must not be resolved again here.
   */
  const tenantResolution = await ciResolveTenantContext({
    request,
    pathnameNormalized,
    tenantRoutingConfig: tenantRoutingOptions,
  });

  const tenant = tenantResolution.tenant;
  let featurePathname = tenantResolution.featurePathname;

  if (tenant.scope === "tenant" && !tenant.exists) {
    return {
      action: "info",
      tenant,
      orgUnit: null,
      featurePathname,
      infoPagePath: tenantRoutingOptions.notFoundPath,
    };
  }

  if (tenant.scope === "tenant" && (tenant.status === "suspended" || tenant.status === "archived")) {
    return {
      action: "info",
      tenant,
      orgUnit: null,
      featurePathname,

      /**
       * archivedPath can be introduced later. Until then, archived Tenants use
       * the suspended information page as the conservative fallback.
       */
      infoPagePath: tenantRoutingOptions.suspendedPath,
    };
  }

  const orgUnitResolution = await ciResolveOrgUnitContext({
    request,
    tenantContext: tenant,
    featurePathname,
    tenantRoutingConfig: tenantRoutingOptions,
  });

  const orgUnit = orgUnitResolution.orgUnit;

  featurePathname = orgUnitResolution.featurePathname;

  /**
   * Unmatched Org Unit candidates intentionally remain part of the logical
   * feature pathname. Under implicit longest-prefix matching, a path segment
   * may represent either an Org Unit segment or an application route.
   */
  if (orgUnitOptions.enforceStatus && (orgUnit?.status === "suspended" || orgUnit?.status === "archived")) {
    return {
      action: "info",
      tenant,
      orgUnit,
      featurePathname,

      /**
       * archivedPath can be introduced later. Until then, archived Org Units
       * use the suspended information page.
       */
      infoPagePath: orgUnitOptions.suspendedPath,
    };
  }

  return {
    action: "continue",
    tenant,
    orgUnit,
    featurePathname,
  };
}
