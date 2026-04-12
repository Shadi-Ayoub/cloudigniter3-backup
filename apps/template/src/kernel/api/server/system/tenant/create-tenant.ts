import { cache } from 'react';

import { client } from '@/kernel/api/server';
import { prepareApiRequest } from '@/kernel/api';
import { ciParseGraphqlResponse } from '@cloudigniter/next/utility';
import type {
  CiGraphQLResponse,
  CiRequest,
  CiResponse,
} from '@cloudigniter/next/types';

export const createTenant = cache(
  async (request: CiRequest): Promise<CiResponse> => {
    const apiRequest = prepareApiRequest(request);
    const inputString = JSON.stringify(apiRequest);

    const apiResponse: CiGraphQLResponse = await client.mutations.createTenant(
      {
        inputString,
      },
      { authMode: apiRequest.authMode } // <- 'userPool' for signed-in, 'apikey' for guests
    );

    const ciResponse = ciParseGraphqlResponse(apiResponse, true);

    return ciResponse;
  }
);
