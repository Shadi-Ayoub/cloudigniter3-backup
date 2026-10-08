import { cache } from "react";
import { cookies } from "next/headers";
import type { ClientUsingSSRCookies } from "@aws-amplify/adapter-nextjs/api";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/data";
import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";
import type { Schema } from "@/../amplify/data/resource";
import outputs from "@/../amplify_outputs.json";

const amplifyOutputs = outputs as CiAmplifyOutputs;

export const ciIsSchemaOk = cache(() => {
  const client = generateServerClientUsingCookies<Schema>({
    config: amplifyOutputs,
    cookies,
  }) as ClientUsingSSRCookies<Schema>;

  // const schemaOk = typeof client.queries.GetLambdaParameters === "function";
  const schemaOk = typeof client.queries.GetCognitoUser === "function";

  return schemaOk;
});
