import { updateTenant } from '@CI/server';

import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Update a tenant in the CloudIgniter system table.
 */
export const ciUpdateTenantHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: updateTenant,
});
