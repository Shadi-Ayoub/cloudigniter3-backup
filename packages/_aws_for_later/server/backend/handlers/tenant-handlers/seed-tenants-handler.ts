import { ciIsSeedEnvMode, getEnvMode } from '@CI/utility/server';
import { seedTenants } from '@CI/server';
import type { CiSeedTenantItem, CiSeedTenantsInterface } from '@CI/types';

import { ciCreateLambdaHandler } from '../ci-create-lambda-handler';
import { ciInferHandlerName } from '../ci-infer-handler-name';

/**
 * Seed tenants into the CloudIgniter system table.
 */
export const ciSeedTenantsHandler = ciCreateLambdaHandler<
  CiSeedTenantItem[],
  readonly ['CI_SYSTEM_TABLE_NAME'],
  CiSeedTenantsInterface
>({
  handlerName: ciInferHandlerName(import.meta.url),
  ciEnvVars: ['CI_SYSTEM_TABLE_NAME'] as const,
  requestMode: 'direct-input',

  transformInput: ({ input }) =>
    ({
      tenants: input,
    }) satisfies CiSeedTenantsInterface,

  validate: async ({ input, env, ciValidationError }) => {
    const runtimeEnv = getEnvMode();

    if (!ciIsSeedEnvMode(runtimeEnv)) {
      return ciValidationError(
        `seeding is forbidden in the current environment. Current CI_ENV_MODE=${env.CI_ENV_MODE}.`,
        403
      );
    }

    if (!Array.isArray(input.tenants) || input.tenants.length === 0) {
      return ciValidationError('tenants must be a non-empty array.');
    }

    const invalidTenants = input.tenants.filter(
      (tenant) => !tenant || typeof tenant.tenantId !== 'string' || !tenant.tenantId.trim()
    );

    if (invalidTenants.length > 0) {
      return ciValidationError('each tenant must include a non-empty tenantId.');
    }
  },

  run: async ({ input, env, clientConfig }) =>
    seedTenants({
      tableName: env.CI_SYSTEM_TABLE_NAME,
      clientConfig,
      input,
    }),
});
