import { clearSeederHandler } from '@cloudigniter/next/server/backend';

import type { Schema } from '../../../../data/resource';

type Handler = Schema['clearSeeder']['functionHandler'];
/**
 * * @param event
 * @returns
 */
export const handler: Handler = async (event, context) => {
  return await clearSeederHandler(event, context);
};
