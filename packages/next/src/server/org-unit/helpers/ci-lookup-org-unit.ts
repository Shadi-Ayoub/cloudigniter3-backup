import { ciNormalizePathname } from "@cloudigniter/core/lib";

import type {
  CiOrgUnitContext,
  CiOrgUnitRoutingOptions,
  CiOrgUnitStatus,
} from "@cloudigniter/core/types";

type CiOrgUnitLookupRequest = Pick<Request, "url"> &
  Partial<Pick<Request, "headers">>;

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
 *   ancestorOrgUnitIds: [],
 *   slug: "math",
 *   name: "Mathematics Department",
 *   path: "/academic/grade-10/math",
 *   status: "active",
 * }
 *
 */
export async function ciLookupOrgUnit(
  request: CiOrgUnitLookupRequest,
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
    const lookupUrl = new URL(request.url);

    lookupUrl.pathname = options.lookupPath;
    lookupUrl.search = "";
    lookupUrl.searchParams.set("tenant", normalizedTenantId);
    lookupUrl.searchParams.set("path", normalizedOrgUnitPath);

    // console.log("[CI Org Unit Lookup] Request", {
    //   url: lookupUrl.toString(),
    //   tenantId: normalizedTenantId,
    //   orgUnitPath: normalizedOrgUnitPath,
    // });

    const lookupHeaders = new Headers({ accept: "application/json" });
    const cookie = request.headers?.get("cookie");
    if (cookie) {
      lookupHeaders.set("cookie", cookie);
    }

    const response = await fetch(lookupUrl, {
      method: "GET",
      // This same-origin request must retain the authenticated session so
      // developer-only probe fixtures can repeat their access check.
      headers: lookupHeaders,
      redirect: "error",
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
      ancestorOrgUnitIds?: string[];
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
      ancestorOrgUnitIds: Array.isArray(data.ancestorOrgUnitIds)
        ? data.ancestorOrgUnitIds.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
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
