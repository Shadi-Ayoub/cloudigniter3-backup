import { CI_ENV } from '../../../env/env.keys';
import { ciCreateResourceModule } from '../../resource-module.helpers';
import type { CiTableResourceState } from '../../resource-types';
import { PRIVATE_SETTINGS_TABLE_HANDLERS } from './handlers';
import { ciMakePrivateSettingsTablePolicies } from './policy';

const PRIVATE_SETTINGS_TABLE_ENV_KEYS = [
  CI_ENV.CI_PRIVATE_SETTINGS_TABLE_NAME,
  CI_ENV.CI_PRIVATE_SETTINGS_TABLE_ARN,
] as const;

export const ciPrivateSettingsTableResourceModule = ciCreateResourceModule({
  id: 'privateSettingsTable',
  kind: 'table',
  handlers: PRIVATE_SETTINGS_TABLE_HANDLERS,
  envKeyAllowlist: {
    ciGetSettingsHandler: [...PRIVATE_SETTINGS_TABLE_ENV_KEYS],
    ciSetSettingsHandler: [...PRIVATE_SETTINGS_TABLE_ENV_KEYS],
  } as const satisfies Partial<Record<(typeof PRIVATE_SETTINGS_TABLE_HANDLERS)[number], readonly string[]>>,
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_PRIVATE_SETTINGS_TABLE_NAME]: resource.name,
    [CI_ENV.CI_PRIVATE_SETTINGS_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) =>
    ciMakePrivateSettingsTablePolicies({ privateSettings: resource }, options),
});
