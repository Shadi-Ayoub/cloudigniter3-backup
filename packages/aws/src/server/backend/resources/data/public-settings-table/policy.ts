import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

export function ciMakePublicSettingsTablePolicies(
  tables: { publicSettings: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};
  return {
    inlinePolicies: [
      {
        for: "ciGetSettingsHandler",
        id: "PublicSettingsRead",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:ConditionCheckItem",
            ],
            resources: [tables.publicSettings.arn],
          },
        ],
      },
      {
        for: "ciSetSettingsHandler",
        id: "PublicSettingsWrite",
        statements: [
          {
            effect: "Allow",
            actions: [
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:ConditionCheckItem",
            ],
            resources: [tables.publicSettings.arn],
          },
        ],
      },
    ],
  };
}
