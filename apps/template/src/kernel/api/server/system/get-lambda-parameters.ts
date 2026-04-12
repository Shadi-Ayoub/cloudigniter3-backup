'use server';

import type { CiGraphQLResponse, CiResponse } from '@cloudigniter/next/types';
import { ciParseGraphqlResponse } from '@cloudigniter/next/utility';
import { cookies } from 'next/headers';
import {
  generateServerClientUsingCookies,
  type ClientUsingSSRCookies,
} from '@aws-amplify/adapter-nextjs/api';

import type { CiAmplifyOutputs } from '@cloudigniter/next/types';

import outputs from '@/../amplify_outputs.json';
import type { Schema } from '@/../amplify/data/resource';

// import { server } from '../server';

const config = outputs as CiAmplifyOutputs;

export async function getLambdaParameters(): Promise<CiResponse> {
  const amplifyClient = generateServerClientUsingCookies<Schema>({
    config,
    cookies,
  }) as ClientUsingSSRCookies<Schema>;

  const response: CiGraphQLResponse =
    await amplifyClient.queries.GetLambdaParameters({});

  return ciParseGraphqlResponse(response);

  // return parseApiResponse({ data: {} });
}
