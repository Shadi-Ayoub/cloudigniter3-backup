import { listOrgUnits } from '@CI/server';
import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * List org units from the CloudIgniter system table.
 */
export const ciListOrgUnitsHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: listOrgUnits,
});
