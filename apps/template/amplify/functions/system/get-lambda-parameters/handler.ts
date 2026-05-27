import { GetLambdaParametersHandler } from '@cloudigniter/next/server/backend';
import type { Schema } from '../../../data/resource';

type Handler = Schema['GetLambdaParameters']['functionHandler'];
/**
 * * @param event
 * @returns
 */
export const handler: Handler = async (event, context) => {
  return await GetLambdaParametersHandler(event, context);
};
