import { CI_ENV } from "../../../env/env.keys";
import { ciCreateResourceModule } from "../../resource-module.helpers";
import type { CiTableResourceState } from "../../resource-types";

export const ciUserProfileTableResourceModule = ciCreateResourceModule({
  id: "userProfileTable",
  kind: "table",
  status: "active",
  // CRUD handler IDs remain planned until implementations and Amplify bindings exist.
  handlers: [] as const,
  tableKeys: ["userProfileTable"],
  envKeyAllowlist: {},
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_USER_PROFILE_TABLE_NAME]: resource.name,
    [CI_ENV.CI_USER_PROFILE_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: () => ({}),
});
