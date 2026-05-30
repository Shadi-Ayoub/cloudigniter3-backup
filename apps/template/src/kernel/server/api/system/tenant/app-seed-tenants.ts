import { cache } from "react";

import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import type {
  CiGraphQLResponse,
  CiRequest,
  CiResponse,
  CiSeedTenantItem,
} from "@cloudigniter/core/types";

import { appPrepareServerApiRequest, appServerClient } from "@/kernel/server";

/**
 * Call the Tenant Seeder handler via AppSync.
 * - calls a GraphQL mutation named `seedTenants`.
 * - Backend handler will validate that envMode is 'test' or 'sandbox'.
 */
export const appSeedTenants = cache(
  async (request: CiRequest<CiSeedTenantItem[]>): Promise<CiResponse> => {
    // Basic guards before hitting GraphQL/Lambda
    // if (!request?.envMode) {
    //   return {
    //     statusCode: 400,
    //     body: { error: 'envMode is required ("test" or "sandbox")' },
    //   };
    // }

    // Guard: only allow requested envMode = 'test' | 'sandbox'
    if (
      request?.envMode &&
      request.envMode !== "test" &&
      request.envMode !== "development"
    ) {
      return {
        ok: false,
        statusCode: 400,
        body: {
          error: `Invalid envMode in request: ${request.envMode}. envMode must be "test" or "sandbox".`,
        },
      };
    }

    if (!Array.isArray(request.input) || request.input.length === 0) {
      return {
        ok: false,
        statusCode: 400,
        body: { error: "tenants must be a non-empty array" },
      };
    }

    const apiRequest = appPrepareServerApiRequest(request);
    const inputString = JSON.stringify(apiRequest);

    const apiResponse: CiGraphQLResponse =
      await appServerClient.mutations.seedTenants(
        {
          inputString,
        },
        { authMode: apiRequest.authMode }, // <- 'userPool' for signed-in, 'apikey' for guests);
      );

    const ciResponse = ciParseGraphqlResponse(apiResponse, true);

    return ciResponse;

    // if (ciResponse.statusCode !== 200) {
    //   throw Error(
    //     `Could not seed tenants! ${JSON.stringify(apiResponse.errors)}`
    //   );
    // }

    // const result = ciResponse.body as SeedTenantsResult;
  },
);
