'use client';

import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import amplifyOutputs from '@/../amplify_outputs.json';
// import type { CiAmplifyOutputs } from '@cloudigniter/next/types';

const config = parseAmplifyConfig(amplifyOutputs);

Amplify.configure(config, { ssr: true });

export default function AmplifyConfig() {
  return null;
}
