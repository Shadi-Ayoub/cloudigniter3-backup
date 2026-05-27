import type { Context } from 'aws-lambda';

import type { CiLambdaEvent } from '@cloudigniter/next/types';
import { getTenantHandler } from '@cloudigniter/next/server/backend';

import type { Schema } from '../../../../data/resource';

type Handler = Schema['getTenant']['functionHandler'];

export const handler: Handler = async (
  event: CiLambdaEvent,
  context: Context
) => {
  return await getTenantHandler(event, context);
};
