import type {
  CiTenantRoutingOptions,
  CiTenantStatus,
} from "@cloudigniter/core/types";

type CiRequestForTenantLookup = Pick<Request, "headers" | "url">;

/**
 * Looks up a tenant through the configured internal tenant lookup endpoint.
 */
export async function ciLookupTenant(
  request: CiRequestForTenantLookup,
  tenantId: string,
  options: Required<CiTenantRoutingOptions>,
): Promise<{
  exists: boolean;
  status?: CiTenantStatus;
}> {
  if (!tenantId) {
    return { exists: false };
  }

  try {
    const requestUrl = new URL(request.url);
    const lookupUrl = new URL(options.lookupPath, requestUrl.origin);

    lookupUrl.searchParams.set("tenant", tenantId);

    const response = await fetch(lookupUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return { exists: false };
    }

    const data = (await response.json()) as {
      exists?: boolean;
      status?: CiTenantStatus;
    };

    return {
      exists: data.exists === true,
      status: data.status ?? "active",
    };
  } catch {
    return { exists: false };
  }
}
