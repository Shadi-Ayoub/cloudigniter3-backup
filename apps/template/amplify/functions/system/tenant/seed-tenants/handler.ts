import { seedTenantsHandler } from '@cloudigniter/next/server/backend';

import type { Schema } from '../../../../data/resource';

type Handler = Schema['seedTenants']['functionHandler'];
/**
 * * @param event
 * @returns
 */
export const handler: Handler = async (event, context) => {
  return await seedTenantsHandler(event, context);
};
