import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";

import type {
  CiGraphQLResponse,
  CiRequest,
  CiSeederInputItem,
  CiSeederItemKey,
} from "@cloudigniter/core/types";

import { appPrepareServerApiRequest, appServerClient } from "@/kernel/server";

type SeedResult = { message?: string; count?: number };

export async function appSeedItem(
  seedInput: CiRequest<CiSeederInputItem>,
): Promise<SeedResult> {
  switch (seedInput.input.item) {
    case "tenants": {
      // TODO: validate mock, then call your existing seedTenants-like server API
      // Example shape: const tenants = TenantsSchema.parse(mock);
      // const result = await apiOnServer.seedTenants({ input: tenants, envMode: ... });
      const seedRequest = { ...seedInput, input: seedInput.input.mock };
      const apiRequest = appPrepareServerApiRequest(seedRequest);
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
    }

    case "users": {
      // TODO: seed users to Cognito + UserProfile table, etc.
      return {
        message: "Users seeded (placeholder)",
        count: Array.isArray(seedInput.input.mock)
          ? seedInput.input.mock.length
          : undefined,
      };
    }

    case "orgUnits": {
      // TODO: seed organizational units hierarchy in system table
      return { message: "Org Units seeded (placeholder)" };
    }

    default:
      throw new Error(`Unsupported seed item: ${String(seedInput.input.item)}`);
  }
}

export async function appClearItem(
  seedInput: CiRequest<CiSeederInputItem>,
): Promise<SeedResult> {
  const seedRequest = { ...seedInput, input: seedInput.input.item };
  const apiRequest = appPrepareServerApiRequest(seedRequest);
  const inputString = JSON.stringify(apiRequest);

  const apiResponse: CiGraphQLResponse =
    await appServerClient.mutations.clearSeeder(
      {
        inputString,
      },
      { authMode: apiRequest.authMode }, // <- 'userPool' for signed-in, 'apikey' for guests);
    );

  const ciResponse = ciParseGraphqlResponse(apiResponse, true);

  return ciResponse;
}
