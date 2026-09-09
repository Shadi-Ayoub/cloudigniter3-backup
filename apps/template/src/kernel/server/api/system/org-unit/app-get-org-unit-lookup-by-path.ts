import { cache } from "react";

import {
  CI_DEV_TENANT_RESOLUTION_PROBES,
  CI_MOCK_ORG_UNITS,
  ciNormalizePathname,
  ciParseGraphqlResponse,
} from "@cloudigniter/core/lib";

import type {
  CiGetOrgUnitByPathInterface,
  CiRequest,
  CiResponse,
} from "@cloudigniter/core/types";
import { appPrepareServerApiRequest } from "../../app-prepare-server-api-request";
import { appServerClient } from "../../app-server-client";
import { appGetDevBeaconAccess } from "../../../auth/app-get-dev-beacon-access";
import { appGetCoreConfig } from "../../../config/app-get-core-config";

/**
 * Resolves an Org Unit by its canonical hierarchical path within a Tenant
 * through the System-table tenant attachment record.
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

    // Dev Beacon's reserved tenant uses in-memory routing fixtures. Keep that
    // source available only through the same trusted access gate as the checkup.
    if (
      tenantId === CI_DEV_TENANT_RESOLUTION_PROBES.tenant.active &&
      (await appGetDevBeaconAccess(appGetCoreConfig().dev?.debug?.devBeacon))
        .allowed
    ) {
      const orgUnit = CI_MOCK_ORG_UNITS.find(
        (item) => item.tenantId === tenantId && item.path === orgUnitPath,
      );
      return {
        ok: true,
        statusCode: 200,
        body: orgUnit
          ? { exists: true, ...orgUnit }
          : { exists: false, tenantId, path: orgUnitPath },
      };
    }

    const input = appPrepareServerApiRequest({
      input: { tenantId, orgUnitPath },
    });
    const response = await appServerClient.queries.GetOrgUnitByPath(
      { inputString: JSON.stringify(input) },
      { authMode: "apiKey" },
    );
    const parsed = ciParseGraphqlResponse(response, true);
    if (!parsed.ok) return parsed;
    const body = parsed.body as {
      exists: boolean;
      orgUnit?: Record<string, unknown>;
    };
    return {
      ok: true,
      statusCode: 200,
      body: body.exists && body.orgUnit
        ? { exists: true, ...body.orgUnit }
        : { exists: false, tenantId, path: orgUnitPath },
    };
  },
);
