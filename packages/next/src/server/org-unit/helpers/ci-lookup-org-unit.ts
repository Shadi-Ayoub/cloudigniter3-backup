import type { NextRequest } from "next/server";

import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type {
  CiOrgUnitContext,
  CiOrgUnitRoutingOptions,
  CiOrgUnitStatus,
} from "@cloudigniter/core/types";

/**
 * Looks up an Org Unit through the configured internal Org Unit lookup endpoint.
 *
 * Example:
 * lookupOrgUnit: (tenantId, orgUnitPath) =>
 *    ciLookupOrgUnit(
 *    request,
 *    tenantId,
 *    orgUnitPath,
 *    orgUnitOpts,
 * ),
 *
 * GET /ci-internal/org-unit-lookup?tenant=<tenantId>&path=<orgUnitPath>
 *
 * with a successful body shaped as:
 * {
 *   exists: true,
 *   id: "org-unit-id",
 *   tenantId: "tenant-id",
 *   parentId: null,
 *   slug: "math",
 *   name: "Mathematics Department",
 *   path: "/academic/grade-10/math",
 *   status: "active",
 * }
 *
 */
export async function ciLookupOrgUnit(
  request: NextRequest,
  tenantId: string,
  orgUnitPath: string,
  options: Required<CiOrgUnitRoutingOptions>,
): Promise<CiOrgUnitContext | null> {
  const normalizedTenantId = tenantId.trim();
  const normalizedOrgUnitPath = ciNormalizePathname(orgUnitPath);

  if (!normalizedTenantId || normalizedOrgUnitPath === "/") {
    return null;
  }

  try {
    const lookupUrl = request.nextUrl.clone();

    lookupUrl.pathname = options.lookupPath;
    lookupUrl.search = "";
    lookupUrl.searchParams.set("tenant", normalizedTenantId);
    lookupUrl.searchParams.set("path", normalizedOrgUnitPath);

    // console.log("[CI Org Unit Lookup] Request", {
    //   url: lookupUrl.toString(),
    //   tenantId: normalizedTenantId,
    //   orgUnitPath: normalizedOrgUnitPath,
    // });

    const response = await fetch(lookupUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    const rawBody = await response.text();

    // console.log("[CI Org Unit Lookup] Response", {
    //   status: response.status,
    //   ok: response.ok,
    //   body: rawBody,
    // });

    if (!response.ok) {
      return null;
    }

    const data = JSON.parse(rawBody) as {
      exists?: boolean;
      id?: string;
      tenantId?: string;
      parentId?: string | null;
      slug?: string;
      name?: string;
      path?: string;
      status?: CiOrgUnitStatus;
    };

    if (
      data.exists !== true ||
      !data.id ||
      !data.tenantId ||
      !data.slug ||
      !data.path ||
      !data.status
    ) {
      console.warn("[CI Org Unit Lookup] Invalid lookup payload.", data);

      return null;
    }

    if (
      data.tenantId !== normalizedTenantId ||
      ciNormalizePathname(data.path) !== normalizedOrgUnitPath
    ) {
      console.warn("[CI Org Unit Lookup] Lookup payload mismatch.", {
        expectedTenantId: normalizedTenantId,
        receivedTenantId: data.tenantId,
        expectedPath: normalizedOrgUnitPath,
        receivedPath: data.path,
      });

      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenantId,
      parentId: data.parentId ?? null,
      slug: data.slug,
      name: data.name,
      path: ciNormalizePathname(data.path),
      status: data.status,
    };
  } catch (error) {
    console.error("[CI Org Unit Lookup] Lookup failed.", error);

    return null;
  }
}
