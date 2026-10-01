import { CI_ENV } from "../../../env/env.keys";
import { ciCreateResourceModule } from "../../resource-module.helpers";
import type { CiTableResourceState } from "../../resource-types";
import { ciMakeUserSettingsTablePolicies } from "./policy";

export const ciUserSettingsTableResourceModule = ciCreateResourceModule({
  id: "userSettingsTable",
  kind: "table",
  status: "active",
  handlers: [] as const,
  tableKeys: ["userSettingsTable"],
  envKeyAllowlist: {},
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_USER_SETTINGS_TABLE_NAME]: resource.name,
    [CI_ENV.CI_USER_SETTINGS_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) =>
    ciMakeUserSettingsTablePolicies({ userSettings: resource }, options),
});
