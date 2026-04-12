import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { cookies } from 'next/headers';

import type { CiAmplifyOutputs } from '@cloudigniter/next/types';

import outputs from '../../../amplify_outputs.json';

const config = outputs as CiAmplifyOutputs;

export const { runWithAmplifyServerContext } = createServerRunner({
  config,
});

export function withAmplify<T>(fn: () => Promise<T>) {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: fn,
  });
}
