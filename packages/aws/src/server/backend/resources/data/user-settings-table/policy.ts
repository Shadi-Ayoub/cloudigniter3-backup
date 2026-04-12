import type { CiPlanOptions, CiPolicyFragment } from '../../../types';
import type { CiTableResourceState } from '../../resource-types';

export function ciMakeUserSettingsTablePolicies(
  tables: { userSettings: CiTableResourceState },
  options: CiPlanOptions
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
    inlinePolicies: [
      {
        for: 'ciGetSettingsHandler',
        id: 'UserSettingsDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
            resources: [tables.userSettings.arn],
          },
        ],
      },
      {
        for: 'ciSetSettingsHandler',
        id: 'UserSettingsDdbReadWrite',
        statements: [
          {
            effect: 'Allow',
            actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
            resources: [tables.userSettings.arn],
          },
        ],
      },
    ],
    tableGrants: [
      { for: 'ciGetSettingsHandler', table: 'userSettingsTable', actions: ['Query', 'BatchWriteItem'] },
      {
        for: 'ciSetSettingsHandler',
        table: 'userSettingsTable',
        actions: ['PutItem', 'DeleteItem', 'TransactWriteItems'],
      },
    ],
  };
}
