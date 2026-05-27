import type { Context } from 'aws-lambda';

import type { CiLambdaEvent } from '@cloudigniter/next/types';
import { ciGetSettingsHandler } from '@cloudigniter/next/server/backend';

import type { Schema } from '../../../../data/resource';

type Handler = Schema['getSettings']['functionHandler'];

export const handler: Handler = async (
  event: CiLambdaEvent,
  context: Context
) => {
  return await ciGetSettingsHandler(event, context);
};
