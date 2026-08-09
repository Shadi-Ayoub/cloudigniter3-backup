import type { CiPlanOptions, CiPolicyFragment } from "../../../types";
import type { CiTableResourceState } from "../../resource-types";

/**
 * Build table grants for the planned User Profile CRUD handlers.
 * The active table module does not invoke this until those handlers exist.
 */
export function ciMakeUserProfileTablePolicies(
  _tables: { userProfile: CiTableResourceState },
  options: CiPlanOptions,
): CiPolicyFragment {
  if (!options.includeDefaultDynamoPolicies) return {};

  return {
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
