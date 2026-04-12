import { getOrgUnit } from '@CI/server';
import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Get an org unit from the CloudIgniter system table.
 */
export const ciGetOrgUnitHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: getOrgUnit,
});
