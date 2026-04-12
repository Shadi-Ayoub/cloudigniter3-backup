import { CI_ENV } from "../../../env/env.keys";
import { ciCreateResourceModule } from "../../resource-module.helpers";
import type { CiTableResourceState } from "../../resource-types";
import { USER_SETTINGS_TABLE_HANDLERS } from "./handlers";
import { ciMakeUserSettingsTablePolicies } from "./policy";

const USER_SETTINGS_TABLE_ENV_KEYS = [
  CI_ENV.CI_USER_SETTINGS_TABLE_NAME,
  CI_ENV.CI_USER_SETTINGS_TABLE_ARN,
] as const;

export const ciUserSettingsTableResourceModule = ciCreateResourceModule({
  id: "userSettingsTable",
  kind: "table",
  handlers: USER_SETTINGS_TABLE_HANDLERS,
  envKeyAllowlist: {
    ciGetSettingsHandler: [...USER_SETTINGS_TABLE_ENV_KEYS],
    ciSetSettingsHandler: [...USER_SETTINGS_TABLE_ENV_KEYS],
  } as const satisfies Partial<
    Record<(typeof USER_SETTINGS_TABLE_HANDLERS)[number], readonly string[]>
  >,
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_USER_SETTINGS_TABLE_NAME]: resource.name,
    [CI_ENV.CI_USER_SETTINGS_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) =>
    ciMakeUserSettingsTablePolicies({ userSettings: resource }, options),
});
