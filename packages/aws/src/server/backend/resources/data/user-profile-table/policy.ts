import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

export function ciMakeUserProfileTablePolicies(
  tables: { userProfile: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
    inlinePolicies: [
      {
        for: "ciGetUserProfileHandler",
        id: "UserProfileDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:Query"],
            resources: [tables.userProfile.arn],
          },
        ],
      },
      {
        for: "ciCreateUserProfileHandler",
        id: "UserProfileDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:PutItem"],
            resources: [tables.userProfile.arn],
          },
        ],
      },
      {
        for: "ciUpdateUserProfileHandler",
        id: "UserProfileDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:UpdateItem"],
            resources: [tables.userProfile.arn],
          },
        ],
      },
      {
        for: "ciDeleteUserProfileHandler",
        id: "UserProfileDdbReadWrite",
        statements: [
          {
            effect: "Allow",
            actions: ["dynamodb:GetItem", "dynamodb:DeleteItem"],
            resources: [tables.userProfile.arn],
          },
        ],
      },
    ],
    tableGrants: [
      {
        for: "ciGetUserProfileHandler",
        table: "userProfileTable",
        actions: ["GetItem", "Query"],
      },
      {
        for: "ciCreateUserProfileHandler",
        table: "userProfileTable",
        actions: ["PutItem"],
      },
      {
        for: "ciUpdateUserProfileHandler",
        table: "userProfileTable",
        actions: ["GetItem", "UpdateItem"],
      },
      {
        for: "ciDeleteUserProfileHandler",
        table: "userProfileTable",
        actions: ["GetItem", "DeleteItem"],
      },
    ],
  };
}
