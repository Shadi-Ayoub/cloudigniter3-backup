import { getOrgUnitTree } from '@CI/server';
import { ciCreateTableServiceHandler } from '../ci-create-table-service-handler';

/**
 * Get the org unit tree from the CloudIgniter system table.
 */
export const ciGetOrgUnitTreeHandler = ciCreateTableServiceHandler({
  moduleUrl: import.meta.url,
  tableEnvVar: 'CI_SYSTEM_TABLE_NAME',
  service: getOrgUnitTree,
});
