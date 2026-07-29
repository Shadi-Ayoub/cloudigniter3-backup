import { cache } from "react";
import { CI_DEV_TENANT_RESOLUTION_PROBES } from "@cloudigniter/core/lib";
import type { CiGetTenantBySlugInterface, CiRequest, CiResponse, CiTenantStatus } from "@cloudigniter/core/types";

type CiMockTenant = {
  id: string;
  slug: string;
  status: CiTenantStatus;
};

function ciCreateMockTenant(slug: string, status: CiTenantStatus): CiMockTenant {
  return {
    id: slug,
    slug,
    status,
  };
}

const CI_MOCK_TENANTS: Record<string, CiMockTenant> = {
  acme: ciCreateMockTenant("acme", "active"),
  suspended: ciCreateMockTenant("suspended", "suspended"),
  archived: ciCreateMockTenant("archived", "archived"),

  [CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active]: ciCreateMockTenant(
    CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active,
    "active",
  ),

  [CI_DEV_TENANT_RESOLUTION_PROBES.tenant.suspended]: ciCreateMockTenant(
    CI_DEV_TENANT_RESOLUTION_PROBES.tenant.suspended,
    "suspended",
  ),

  [CI_DEV_TENANT_RESOLUTION_PROBES.tenant.archived]: ciCreateMockTenant(
    CI_DEV_TENANT_RESOLUTION_PROBES.tenant.archived,
    "archived",
  ),
};

/**
 * Resolves a Tenant by its route-safe slug using temporary mock data.
 *
 * Replace this implementation with the Amplify-backed lookup once the routing
 * and Org Unit resolution flow have been verified.
 */
export const appGetTenantLookupBySlug = cache(
  async (request: CiRequest<CiGetTenantBySlugInterface>): Promise<CiResponse> => {
    const slug = request.input.slug.trim().toLowerCase();

    if (!slug) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "Tenant slug is required.",
        },
      };
    }

    const tenant = CI_MOCK_TENANTS[slug];

    if (!tenant) {
      return {
        ok: true,
        statusCode: 200,
        body: {
          exists: false,
          slug,
        },
      };
    }

    return {
      ok: true,
      statusCode: 200,
      body: {
        exists: true,
        id: tenant.id,
        slug: tenant.slug,
        status: tenant.status,
      },
    };
  },
);
