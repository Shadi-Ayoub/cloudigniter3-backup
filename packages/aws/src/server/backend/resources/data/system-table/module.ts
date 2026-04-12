import { CI_ENV } from '../../../env/env.keys';
import { ciCreateResourceModule } from '../../resource-module.helpers';
import type { CiTableResourceState } from '../../resource-types';
import { SYSTEM_TABLE_HANDLERS } from './handlers';
import { ciMakeSystemTablePolicies } from './policy';

const SYSTEM_TABLE_ENV_KEYS = [CI_ENV.CI_SYSTEM_TABLE_NAME, CI_ENV.CI_SYSTEM_TABLE_ARN] as const;

export const ciSystemTableResourceModule = ciCreateResourceModule({
  id: 'systemTable',
  kind: 'table',
  handlers: SYSTEM_TABLE_HANDLERS,
  envKeyAllowlist: {
    ciClearSeederHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciCreateTenantHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciDeleteTenantHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciGetTenantHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciGetTenantBySlugHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciGetTenantLookupBySlugHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciListTenantsHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciSeedTenantsHandler: [...SYSTEM_TABLE_ENV_KEYS],
    ciUpdateTenantHandler: [...SYSTEM_TABLE_ENV_KEYS],
  } as const satisfies Partial<Record<(typeof SYSTEM_TABLE_HANDLERS)[number], readonly string[]>>,
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_SYSTEM_TABLE_NAME]: resource.name,
    [CI_ENV.CI_SYSTEM_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) => ciMakeSystemTablePolicies({ system: resource }, options),
});
