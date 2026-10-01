import { CI_ENV } from "../../../env/env.keys";
import { ciCreateResourceModule } from "../../resource-module.helpers";
import { SYSTEM_TABLE_HANDLERS } from "./handlers";
import { ciMakeSystemTablePolicies } from "./policy";

const SYSTEM_TABLE_ENV_KEYS = [
  CI_ENV.CI_SYSTEM_TABLE_NAME,
  CI_ENV.CI_SYSTEM_TABLE_ARN,
] as const;

export const ciSystemTableResourceModule = ciCreateResourceModule({
  id: "systemTable",
  kind: "table",
  status: "active",
  handlers: SYSTEM_TABLE_HANDLERS,
  tableKeys: ["systemTable"],
  dependencies: ["emberguardAccessTable"],
  envKeyAllowlist: {
    ciCleanupSeededTenantsHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
    ciDeleteTenantHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
    ciListTenantsHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciPurgeTenantHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
    ciRestoreTenantHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
    ciSeedTenantsHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
    ciSetTenantStatusHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
    ciCreateOrgUnitHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
    ciGetOrgUnitByPathHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciListOrgUnitsHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciUpdateOrgUnitHandler: [
      ...SYSTEM_TABLE_ENV_KEYS,
      CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME,
    ],
  } as const satisfies Partial<
    Record<(typeof SYSTEM_TABLE_HANDLERS)[number], readonly string[]>
  >,
  resolveEnvValues: ({ resource, resources }) => ({
    ...(resources.emberguardAccessTable?.name
      ? {
          [CI_ENV.CI_EMBERGUARD_ACCESS_TABLE_NAME]:
            resources.emberguardAccessTable.name,
        }
      : {}),
    [CI_ENV.CI_SYSTEM_TABLE_NAME]: resource.name,
    [CI_ENV.CI_SYSTEM_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) =>
    ciMakeSystemTablePolicies({ system: resource }, options),
});
