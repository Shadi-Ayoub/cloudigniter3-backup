import { updateOrgUnit } from '@CI/server';
import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Update an org unit in the CloudIgniter system table.
 */
export const ciUpdateOrgUnitHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: updateOrgUnit,
});
