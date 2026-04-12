import { cache } from 'react';

import { ciParseGraphqlResponse } from '@cloudigniter/next/utility';
import type {
  CiGraphQLResponse,
  CiRequest,
  CiResponse,
  SeedTenantItem,
} from '@cloudigniter/next/types';

import { client } from '@/kernel/api/server';
import { prepareApiRequest } from '@/kernel/api';

/**
 * Call the Tenant Seeder handler via AppSync.
 * - calls a GraphQL mutation named `seedTenants`.
 * - Backend handler will validate that envMode is 'test' or 'sandbox'.
 */
export const seedTenants = cache(
  async (request: CiRequest<SeedTenantItem[]>): Promise<CiResponse> => {
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
      request.envMode !== 'test' &&
      request.envMode !== 'sandbox'
    ) {
      return {
        statusCode: 400,
        body: {
          error: `Invalid envMode in request: ${request.envMode}. envMode must be "test" or "sandbox".`,
        },
      };
    }

    if (!Array.isArray(request.input) || request.input.length === 0) {
      return {
        statusCode: 400,
        body: { error: 'tenants must be a non-empty array' },
      };
    }

    const apiRequest = prepareApiRequest(request);
    const inputString = JSON.stringify(apiRequest);

    const apiResponse: CiGraphQLResponse = await client.mutations.seedTenants(
      {
        inputString,
      },
      { authMode: apiRequest.authMode } // <- 'userPool' for signed-in, 'apikey' for guests);
    );

    const ciResponse = ciParseGraphqlResponse(apiResponse, true);

    return ciResponse;

    // if (ciResponse.statusCode !== 200) {
    //   throw Error(
    //     `Could not seed tenants! ${JSON.stringify(apiResponse.errors)}`
    //   );
    // }

    // const result = ciResponse.body as SeedTenantsResult;
  }
);
