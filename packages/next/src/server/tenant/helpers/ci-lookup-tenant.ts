import type { CiTenantLookupResult, CiTenantRoutingOptions, CiTenantStatus } from "@cloudigniter/core/types";

type CiRequestForTenantLookup = Pick<Request, "headers" | "url">;

/**
 * Looks up a Tenant by its canonical route-safe slug through the configured
 * internal Tenant lookup endpoint.
 *
 * The lookup resolves the public Tenant slug into its canonical internal
 * identifier and lifecycle information.
 */
export async function ciLookupTenant(
  request: CiRequestForTenantLookup,
  tenantSlug: string,
  options: Required<CiTenantRoutingOptions>,
): Promise<CiTenantLookupResult> {
  const slug = tenantSlug.trim();

  if (!slug) {
    return { exists: false };
  }

  try {
    const requestUrl = new URL(request.url);
    const lookupUrl = new URL(options.lookupPath, requestUrl.origin);

    lookupUrl.searchParams.set("slug", slug);

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
      id?: string;
      slug?: string;
      name?: string;
      type?: string;
      status?: CiTenantStatus;
    };

    /**
     * A successful lookup must provide the canonical internal identifier and
     * route-safe slug. Treat incomplete responses as unresolved Tenants.
     */
    if (
      data.exists !== true ||
      typeof data.id !== "string" ||
      !data.id.trim() ||
      typeof data.slug !== "string" ||
      !data.slug.trim()
    ) {
      return { exists: false };
    }

    return {
      exists: true,
      id: data.id,
      slug: data.slug,
      status: data.status ?? "active",
      ...(data.name
        ? {
            name: data.name,
          }
        : {}),
      ...(data.type
        ? {
            type: data.type,
          }
        : {}),
    };
  } catch {
    return { exists: false };
  }
}
