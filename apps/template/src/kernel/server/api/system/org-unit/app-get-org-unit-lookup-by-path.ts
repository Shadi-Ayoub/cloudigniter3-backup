import { cache } from "react";

import { CI_MOCK_ORG_UNITS, ciNormalizePathname } from "@cloudigniter/core/lib";

import type {
  CiGetOrgUnitByPathInterface,
  CiRequest,
  CiResponse,
} from "@cloudigniter/core/types";

/**
 * Resolves an Org Unit by its canonical hierarchical path within a Tenant
 * using temporary mock data.
 *
 * Replace this implementation with the Amplify-backed lookup once the routing
 * and Org Unit resolution flow have been verified.
 */
export const appGetOrgUnitLookupByPath = cache(
  async (
    request: CiRequest<CiGetOrgUnitByPathInterface>,
  ): Promise<CiResponse> => {
    const tenantId = request.input.tenantId.trim();
    const orgUnitPath = ciNormalizePathname(request.input.orgUnitPath);

    if (!tenantId || orgUnitPath === "/") {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: "Tenant id and Org Unit path are required.",
        },
      };
    }

    const orgUnit = CI_MOCK_ORG_UNITS.find(
      (item) => item.tenantId === tenantId && item.path === orgUnitPath,
    );

    if (!orgUnit) {
      return {
        ok: true,
        statusCode: 200,
        body: {
          exists: false,
          tenantId,
          path: orgUnitPath,
        },
      };
    }

    return {
      ok: true,
      statusCode: 200,
      body: {
        exists: true,
        ...orgUnit,
      },
    };
  },
);
