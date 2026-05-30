import { cache } from "react";
import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import type {
  CiGraphQLResponse,
  CiRequest,
  CiResponse,
} from "@cloudigniter/core/types";

import { appPrepareServerApiRequest, appServerClient } from "@/kernel/server";

export const appGetTenantLookupBySlug = cache(
  async (request: CiRequest): Promise<CiResponse> => {
    const apiRequest = appPrepareServerApiRequest(request);
    const inputString = JSON.stringify(apiRequest);

    const apiResponse: CiGraphQLResponse =
      await appServerClient.queries.getTenantLookupBySlug(
        {
          inputString,
        },
        { authMode: apiRequest.authMode }, // <- 'userPool' for signed-in, 'apikey' for guests
      );

    const ciResponse = ciParseGraphqlResponse(apiResponse, true);

    return ciResponse;
  },
);
