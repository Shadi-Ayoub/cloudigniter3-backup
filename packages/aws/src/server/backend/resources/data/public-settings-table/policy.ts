import type { CiPlanOptions, CiPolicyFragment } from '../../../types';
import type { CiTableResourceState } from '../../resource-types';

export function ciMakePublicSettingsTablePolicies(
  tables: { publicSettings: CiTableResourceState },
  options: CiPlanOptions
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
    inlinePolicies: [
      {
        for: 'ciGetSettingsHandler',
        id: 'PublicSettingsDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
            resources: [tables.publicSettings.arn],
          },
        ],
      },
      {
        for: 'ciSetSettingsHandler',
        id: 'PublicSettingsDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
            resources: [tables.publicSettings.arn],
          },
        ],
      },
    ],
    tableGrants: [
      { for: 'ciGetSettingsHandler', table: 'publicSettingsTable', actions: ['Query', 'BatchWriteItem'] },
      {
        for: 'ciSetSettingsHandler',
        table: 'publicSettingsTable',
        actions: ['PutItem', 'DeleteItem', 'TransactWriteItems'],
      },
    ],
  };
}
