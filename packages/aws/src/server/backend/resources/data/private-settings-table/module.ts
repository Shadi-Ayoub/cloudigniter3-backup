import { CI_ENV } from "../../../env/env.keys";
import { ciCreateResourceModule } from "../../resource-module.helpers";
import type { CiTableResourceState } from "../../resource-types";
import { ciMakePrivateSettingsTablePolicies } from "./policy";

export const ciPrivateSettingsTableResourceModule = ciCreateResourceModule({
  id: "privateSettingsTable",
  kind: "table",
  status: "active",
  handlers: [] as const,
  tableKeys: ["privateSettingsTable"],
  envKeyAllowlist: {},
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_PRIVATE_SETTINGS_TABLE_NAME]: resource.name,
    [CI_ENV.CI_PRIVATE_SETTINGS_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) =>
    ciMakePrivateSettingsTablePolicies({ privateSettings: resource }, options),
});
