import { listTenantsHandler } from '@cloudigniter/next/server/backend';

import type { Schema } from '../../../../data/resource';

type Handler = Schema['listTenants']['functionHandler'];
/**
 * * @param event
 * @returns
 */
export const handler: Handler = async (event, context) => {
  return await listTenantsHandler(event, context);
};
