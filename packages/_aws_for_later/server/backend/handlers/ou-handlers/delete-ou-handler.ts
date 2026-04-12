import { deleteOrgUnit } from '@CI/server';
import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Delete an org unit from the CloudIgniter system table.
 */
export const ciDeleteOrgUnitHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: deleteOrgUnit,
});
