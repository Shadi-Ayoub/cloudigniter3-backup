import { cache } from "react";

import { ciNormalizePathname, ciParseGraphqlResponse } from "@cloudigniter/core/lib";

import type {
  CiGetOrgUnitByPathInterface,
  CiRequest,
  CiResponse,
} from "@cloudigniter/core/types";
import { appPrepareServerApiRequest } from "../../app-prepare-server-api-request";
import { appServerClient } from "../../app-server-client";

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
