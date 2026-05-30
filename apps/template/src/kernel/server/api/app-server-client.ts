import { cookies } from "next/headers";
import {
  generateServerClientUsingCookies,
  type ClientUsingSSRCookies,
} from "@aws-amplify/adapter-nextjs/data";

import type { CiAmplifyOutputs } from "@cloudigniter/aws/types";

import outputs from "@/../amplify_outputs.json";
import type { Schema } from "@/../amplify/data/resource";

const config = outputs as CiAmplifyOutputs;

export function ciCreateServerClient(): ClientUsingSSRCookies<Schema> {
  return generateServerClientUsingCookies<Schema>({
    config,
    cookies,
  }) as ClientUsingSSRCookies<Schema>;
}

const appServerClient = ciCreateServerClient();

export { appServerClient };
