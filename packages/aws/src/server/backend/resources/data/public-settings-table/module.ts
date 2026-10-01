import { CI_ENV } from "../../../env/env.keys";
import { ciCreateResourceModule } from "../../resource-module.helpers";
import { ciMakePublicSettingsTablePolicies } from "./policy";
const SETTINGS_ENV = [
  CI_ENV.CI_PUBLIC_SETTINGS_TABLE_NAME,
  CI_ENV.CI_PRIVATE_SETTINGS_TABLE_NAME,
  CI_ENV.CI_USER_SETTINGS_TABLE_NAME,
  CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
  CI_ENV.CI_SYSTEM_TABLE_NAME,
] as const;

export const ciPublicSettingsTableResourceModule = ciCreateResourceModule({
  id: "publicSettingsTable",
  kind: "table",
  status: "active",
  handlers: ["ciGetSettingsHandler", "ciSetSettingsHandler"] as const,
  tableKeys: ["publicSettingsTable"],
  envKeyAllowlist: {
    ciGetSettingsHandler: SETTINGS_ENV,
    ciSetSettingsHandler: SETTINGS_ENV,
  },
  resolveEnvValues: ({ resource, resources }) => ({
    [CI_ENV.CI_PUBLIC_SETTINGS_TABLE_NAME]: resource.name,
    [CI_ENV.CI_PUBLIC_SETTINGS_TABLE_ARN]: resource.arn,
    ...(resources.systemTable?.name
      ? { [CI_ENV.CI_SYSTEM_TABLE_NAME]: resources.systemTable.name }
      : {}),
  }),
  resolvePolicies: ({ resource, options }) =>
    ciMakePublicSettingsTablePolicies({ publicSettings: resource }, options),
});
