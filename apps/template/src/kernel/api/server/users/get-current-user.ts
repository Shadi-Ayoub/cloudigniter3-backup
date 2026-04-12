'use server';

import { getCurrentUser as _getCurrentUser } from '@cloudigniter/next/server';

import type { CiAmplifyOutputs } from '@cloudigniter/next/types';

import outputs from '@/../amplify_outputs.json';

const config = outputs as CiAmplifyOutputs;

export async function getCurrentUser() {
  const result = await _getCurrentUser(config);

  return result;
}
