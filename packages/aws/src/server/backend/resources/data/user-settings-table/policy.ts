import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

export function ciMakeUserSettingsTablePolicies(
  tables: { userSettings: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};
  return {
    inlinePolicies: [
      {
        for: "ciGetSettingsHandler",
        id: "UserSettingsRead",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem"],
            resources: [tables.userSettings.arn],
          },
        ],
      },
      {
        for: "ciSetSettingsHandler",
        id: "UserSettingsWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:PutItem"],
            resources: [tables.userSettings.arn],
          },
        ],
      },
    ],
  };
}
