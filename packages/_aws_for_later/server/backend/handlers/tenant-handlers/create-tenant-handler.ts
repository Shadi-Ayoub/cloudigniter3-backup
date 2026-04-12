import { createTenant } from '@CI/server';

import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Create a tenant in the CloudIgniter system table.
 */
export const ciCreateTenantHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: createTenant,
});
