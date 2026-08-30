import { cache } from "react";

import type {
  CiGraphQLResponse,
  CiRequest,
  CiResponse,
} from "@cloudigniter/core/types";

import { appPrepareServerApiRequest, appServerClient } from "@/kernel/server";
import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";

export const appListTenants = cache(
  async (request: CiRequest): Promise<CiResponse> => {
    const apiRequest = appPrepareServerApiRequest(request);
    const inputString = JSON.stringify(apiRequest);

    const apiResponse: CiGraphQLResponse =
      await appServerClient.queries.ListTenants(
        {
          inputString,
        },
        { authMode: "userPool" },
      );

    const ciResponse = ciParseGraphqlResponse(apiResponse, true);

    return ciResponse;
  },
);
