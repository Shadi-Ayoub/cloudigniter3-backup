import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

export function ciMakePrivateSettingsTablePolicies(
  tables: { privateSettings: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};
  return {
    inlinePolicies: [
      {
        for: "ciGetSettingsHandler",
        id: "PrivateSettingsRead",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:ConditionCheckItem",
            ],
            resources: [tables.privateSettings.arn],
          },
        ],
      },
      {
        for: "ciSetSettingsHandler",
        id: "PrivateSettingsWrite",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:ConditionCheckItem",
            ],
            resources: [tables.privateSettings.arn],
          },
        ],
      },
    ],
  };
}
