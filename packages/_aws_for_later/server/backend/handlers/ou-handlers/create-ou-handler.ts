import { createOrgUnit } from '@CI/server';
import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Create a new org unit in the CloudIgniter system table.
 */
export const ciCreateOrgUnitHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: createOrgUnit,
});
