import type { Context } from 'aws-lambda';

import type { CiLambdaEvent } from '@cloudigniter/next/types';
import { getOrgUnitHandler } from '@cloudigniter/next/server/backend';

import type { Schema } from '../../../../data/resource';

type Handler = Schema['getOrgUnit']['functionHandler'];

export const handler: Handler = async (
  event: CiLambdaEvent,
  context: Context
) => {
  return await getOrgUnitHandler(event, context);
};
