import { cache } from "react";

import { appPrepareServerApiRequest, appServerClient } from "@/kernel/server";
import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import type {
  CiGraphQLResponse,
  CiRequest,
  CiResponse,
} from "@cloudigniter/core/types";

export const appUpdateTenant = cache(
  async (request: CiRequest): Promise<CiResponse> => {
    const apiRequest = appPrepareServerApiRequest(request);
    const inputString = JSON.stringify(apiRequest);

    const apiResponse: CiGraphQLResponse =
      await appServerClient.mutations.createTenant(
        {
          inputString,
        },
        { authMode: apiRequest.authMode }, // <- 'userPool' for signed-in, 'apikey' for guests
      );

    const ciResponse = ciParseGraphqlResponse(apiResponse, true);

    return ciResponse;
  },
);
