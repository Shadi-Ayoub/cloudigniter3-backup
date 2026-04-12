import { getTenantBySlug } from '@CI/server';

import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Get a tenant by slug from the CloudIgniter system table.
 */
export const ciGetTenantBySlugHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: getTenantBySlug,
});
