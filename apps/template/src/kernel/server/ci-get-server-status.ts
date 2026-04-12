import { cache } from 'react';
import { cookies } from 'next/headers';
import type { ClientUsingSSRCookies } from '@aws-amplify/adapter-nextjs/api';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';

import { getServerStatus as _getServerStatus } from '@cloudigniter/next/server';
import type { CiAmplifyOutputs, CiSettings } from '@cloudigniter/next/types';

import type { Schema } from '@/../amplify/data/resource';
import outputs from '@/../amplify_outputs.json';

const config = outputs as CiAmplifyOutputs;

export const ciGetServerStatus = cache(
  async (settings: CiSettings, amplifyConfig: CiAmplifyOutputs) => {
    const client = generateServerClientUsingCookies<Schema>({
      config,
      cookies,
    }) as ClientUsingSSRCookies<Schema>;

    const schemaOk = typeof client.queries.GetLambdaParameters === 'function';
    const status = await _getServerStatus(settings, amplifyConfig, schemaOk);

    return status;
  }
);
