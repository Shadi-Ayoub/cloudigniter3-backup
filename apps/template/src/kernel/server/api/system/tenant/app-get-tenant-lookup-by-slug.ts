import { cache } from "react";
import { CI_DEV_TENANT_RESOLUTION_PROBES } from "@cloudigniter/core/lib";
import type {
  CiGetTenantBySlugInterface,
  CiRequest,
  CiResponse,
  CiTenantStatus,
} from "@cloudigniter/core/types";

const CI_MOCK_TENANTS: Record<string, { status: CiTenantStatus }> = {
  acme: {
    status: "active",
  },
  suspended: {
    status: "suspended",
  },
  archived: {
    status: "archived",
  },
  [CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active]: {
    status: "active",
  },
  [CI_DEV_TENANT_RESOLUTION_PROBES.tenant.suspended]: {
    status: "suspended",
  },
  [CI_DEV_TENANT_RESOLUTION_PROBES.tenant.archived]: {
    status: "archived",
  },
};

/**
 * Resolves a Tenant by its route-safe slug using temporary mock data.
 *
 * Replace this implementation with the Amplify-backed lookup once the routing
 * and Org Unit resolution flow have been verified.
 */
export const appGetTenantLookupBySlug = cache(
  async (
    request: CiRequest<CiGetTenantBySlugInterface>,
  ): Promise<CiResponse> => {
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
        slug,
        status: tenant.status,
      },
    };
  },
);
