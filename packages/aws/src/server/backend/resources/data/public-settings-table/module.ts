import { CI_ENV } from '../../../env/env.keys';
import { ciCreateResourceModule } from '../../resource-module.helpers';
import type { CiTableResourceState } from '../../resource-types';
import { PUBLIC_SETTINGS_TABLE_HANDLERS } from './handlers';
import { ciMakePublicSettingsTablePolicies } from './policy';

const PUBLIC_SETTINGS_TABLE_ENV_KEYS = [
  CI_ENV.CI_PUBLIC_SETTINGS_TABLE_NAME,
  CI_ENV.CI_PUBLIC_SETTINGS_TABLE_ARN,
] as const;

export const ciPublicSettingsTableResourceModule = ciCreateResourceModule({
  id: 'publicSettingsTable',
  kind: 'table',
  handlers: PUBLIC_SETTINGS_TABLE_HANDLERS,
  envKeyAllowlist: {
    ciGetSettingsHandler: [...PUBLIC_SETTINGS_TABLE_ENV_KEYS],
    ciSetSettingsHandler: [...PUBLIC_SETTINGS_TABLE_ENV_KEYS],
  } as const satisfies Partial<Record<(typeof PUBLIC_SETTINGS_TABLE_HANDLERS)[number], readonly string[]>>,
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_PUBLIC_SETTINGS_TABLE_NAME]: resource.name,
    [CI_ENV.CI_PUBLIC_SETTINGS_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) => ciMakePublicSettingsTablePolicies({ publicSettings: resource }, options),
});
