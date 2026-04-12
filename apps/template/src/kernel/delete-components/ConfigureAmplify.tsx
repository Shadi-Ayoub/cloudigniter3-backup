'use client';

import { Amplify, type ResourcesConfig } from 'aws-amplify';
import {
  type AmplifyOutputs,
  type LegacyConfig,
} from 'aws-amplify/adapter-core';

import outputs from '../../../amplify_outputs.json';

const amplifyOutputs = outputs as
  | ResourcesConfig
  | LegacyConfig
  | AmplifyOutputs;

Amplify.configure(amplifyOutputs, { ssr: true });

export function ConfigureAmplifyClientSide() {
  return null;
}
