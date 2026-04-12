import { ciIsSeedEnvMode, getEnvMode } from '@CI/utility/server';
import { clearSeeder } from '@CI/server';
import type { CiClearSeederInterface } from '@CI/types';

import { ciCreateLambdaHandler } from '../ci-create-lambda-handler';
import { ciInferHandlerName } from '../ci-infer-handler-name';

/**
 * Clear a seeded item from the CloudIgniter system table.
 *
 * Safety rules:
 * - only allowed in seed-safe environments
 * - requested envMode must be "test" or "sandbox"
 * - requested envMode must match the runtime CI_ENV_MODE
 * - forbidden in prod/live environments
 */
export const ciClearSeederHandler = ciCreateLambdaHandler<
  CiClearSeederInterface,
  readonly ['CI_SYSTEM_TABLE_NAME'],
  CiClearSeederInterface
>({
  handlerName: ciInferHandlerName(import.meta.url),
  ciEnvVars: ['CI_SYSTEM_TABLE_NAME'] as const,

  validate: async ({ input, env, ciValidationError }) => {
    const runtimeEnv = getEnvMode();

    if (!input || typeof input !== 'object') {
      return ciValidationError('input is required.');
    }

    if (typeof input.item !== 'string' || !input.item.trim()) {
      return ciValidationError('item must be a non-empty string.');
    }

    if (typeof input.seedSetId !== 'string' || !input.seedSetId.trim()) {
      return ciValidationError('seedSetId must be a non-empty string.');
    }

    if (!ciIsSeedEnvMode(input.envMode)) {
      return ciValidationError('envMode must be "test" or "sandbox".');
    }

    if (runtimeEnv === 'prod') {
      return ciValidationError(
        `clearing seeds is forbidden in live environment. Current CI_ENV_MODE=${env.CI_ENV_MODE}.`,
        403
      );
    }

    if (runtimeEnv !== input.envMode) {
      return ciValidationError(
        `requested envMode "${input.envMode}" does not match runtime CI_ENV_MODE "${env.CI_ENV_MODE}".`
      );
    }
  },

  run: async ({ input, env, clientConfig }) =>
    clearSeeder({
      tableName: env.CI_SYSTEM_TABLE_NAME,
      clientConfig,
      input,
    }),
});
