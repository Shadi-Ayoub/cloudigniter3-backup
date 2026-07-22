import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

export function ciMakePrivateSettingsTablePolicies(
  tables: { privateSettings: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
    inlinePolicies: [
      //   {
      //     for: 'ciGetSettingsHandler',
      //     id: 'PrivateSettingsDdbReadWrite',
      //     statements: [
      //       {
      //         effect: 'Allow',
      //         actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
      //         resources: [tables.privateSettings.arn],
      //       },
      //     ],
      //   },
      //   {
      //     for: 'ciSetSettingsHandler',
      //     id: 'PrivateSettingsDdbReadWrite',
      //     statements: [
      //       {
      //         effect: 'Allow',
      //         actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
      //         resources: [tables.privateSettings.arn],
      //       },
      //     ],
      //   },
      // ],
      // tableGrants: [
      //   { for: 'ciGetSettingsHandler', table: 'privateSettingsTable', actions: ['Query', 'BatchWriteItem'] },
      //   {
      //     for: 'ciSetSettingsHandler',
      //     table: 'privateSettingsTable',
      //     actions: ['PutItem', 'DeleteItem', 'TransactWriteItems'],
      //   },
    ],
  };
}
