import { CI_ENV } from "../../../env/env.keys";
import { ciCreateResourceModule } from "../../resource-module.helpers";
import type { CiTableResourceState } from "../../resource-types";
import { EMBERGUARD_ACCESS_TABLE_HANDLERS } from "./handlers";
import { ciMakeEmberguardAccessTablePolicies } from "./policy";

const EMBERGUARD_ACCESS_TABLE_ENV_KEYS = [
  CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
  CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_ARN,
] as const;

export const ciEmberguardAccessTableResourceModule = ciCreateResourceModule({
  id: "emberguardAccessTable",
  kind: "table",
  status: "active",
  handlers: EMBERGUARD_ACCESS_TABLE_HANDLERS,
  tableKeys: ["emberguardAccessTable"],
  envKeyAllowlist: Object.fromEntries(
    EMBERGUARD_ACCESS_TABLE_HANDLERS.map((handlerId) => [
      handlerId,
      [...EMBERGUARD_ACCESS_TABLE_ENV_KEYS],
    ]),
  ) as Partial<
    Record<(typeof EMBERGUARD_ACCESS_TABLE_HANDLERS)[number], readonly string[]>
  >,
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME]: resource.name,
    [CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) =>
    ciMakeEmberguardAccessTablePolicies({ emberguardAccess: resource }, options),
});
