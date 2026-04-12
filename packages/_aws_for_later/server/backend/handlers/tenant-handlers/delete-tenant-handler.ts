import { deleteTenant } from '@CI/server';

import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Delete a tenant from the CloudIgniter system table.
 */
export const ciDeleteTenantHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: deleteTenant,
});
