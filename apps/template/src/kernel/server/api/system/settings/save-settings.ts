import { cookies } from "next/headers";
import {
  generateServerClientUsingCookies,
  type ClientUsingSSRCookies,
} from "@aws-amplify/adapter-nextjs/api";
import { ciParseGraphqlResponse } from "@cloudigniter/core/lib";
import type { CiGraphQLResponse, CiResponse } from "@cloudigniter/core/lib";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

import outputs from "@/../amplify_outputs.json";
import type { Schema } from "@/../amplify/data/resource";

const config = outputs as CiAmplifyOutputs;

const PK = "SETTING#core";
const SK = "META";
const DEFAULT_TENANT = "default";

export async function saveSettings(
  data: Record<string, unknown>,
): Promise<CiResponse> {
  const amplifyClient = generateServerClientUsingCookies<Schema>({
    config,
    cookies,
  }) as ClientUsingSSRCookies<Schema>;

  // const response: CiGraphQLResponse = await amplifyClient.models.System.update({
  //   id: 'settings',
  //   data: JSON.stringify(data),
  // });

  const systemModel = amplifyClient.models.System;

  if (!systemModel?.update) {
    return {
      ok: false,
      statusCode: 500,
      body: {
        error: "Amplify System model is not available.",
      },
    };
  }

  const response: CiGraphQLResponse = await systemModel.update({
    PK,
    SK,
    // Only include fields that exist in UpdateSystemInput
    tenantId: DEFAULT_TENANT,
    name: "Core Settings",
    description: "Platform configuration",
    // For AppSync GraphQL, AWSJSON must be a JSON string
    data: JSON.stringify(data),
  });

  return ciParseGraphqlResponse(response);
}
