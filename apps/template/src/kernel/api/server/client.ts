import { cookies } from 'next/headers';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';

import type { CiAmplifyOutputs } from '@cloudigniter/next/types';

import outputs from '@/../amplify_outputs.json';
import type { Schema } from '@/../amplify/data/resource';

const config = outputs as CiAmplifyOutputs;

function getClient() {
  const client = generateServerClientUsingCookies<Schema>({
    config,
    cookies,
  });

  return client;
}

const client = getClient();

export { client };
