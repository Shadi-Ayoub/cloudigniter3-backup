import { getTenantLookupBySlug } from '@CI/server';

import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Get tenant lookup information by slug from the CloudIgniter system table.
 */
export const ciGetTenantLookupBySlugHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: getTenantLookupBySlug,
});
