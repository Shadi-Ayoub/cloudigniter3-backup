import { ciCreateResourceModule } from '../resource-module.helpers';
import { CI_ENV } from '../../env/env.keys';

import type { CiCoreAuth, CiCoreAuthParams } from '../../core-types/auth';
import type { CiPolicyFragment } from '../../core-types/policy';
import type { CiFunctionEnvMap } from '../env-map';

export const ciAuthResourceModule = ciCreateResourceModule({
  id: 'auth',
  kind: 'auth',
  handlers: ['ciCreateCognitoUserHandler', 'ciGetCognitoUserHandler'] as const,

  envKeyAllowlist: {
    ciCreateCognitoUserHandler: [
      CI_ENV.CI_REGION,
      CI_ENV.CI_ENV_MODE,
      CI_ENV.CI_USER_PROFILE_TABLE_NAME,
      CI_ENV.CI_USER_PROFILE_TABLE_ARN,
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
    ciGetCognitoUserHandler: [
      CI_ENV.CI_REGION,
      CI_ENV.CI_ENV_MODE,
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
  },

  /**
   * Flat values contributed by auth/resource context.
   */
  resolveEnvValues: ({ region, envMode, options, extra }) => {
    const auth = extra?.auth as CiCoreAuth | undefined;
    const params = options.authParams as CiCoreAuthParams | undefined;

    const env: Record<string, string> = {
      [CI_ENV.CI_REGION]: region,
      [CI_ENV.CI_ENV_MODE]: envMode,
      [CI_ENV.CI_USER_PROFILE_TABLE_NAME]: CI_ENV.CI_USER_PROFILE_TABLE_NAME,
      [CI_ENV.CI_USER_PROFILE_TABLE_ARN]: CI_ENV.CI_USER_PROFILE_TABLE_ARN,
    };

    if (params?.userPoolIdParam) {
      env[CI_ENV.CI_USER_POOL_ID_PARAM] = params.userPoolIdParam;
    }

    if (params?.userPoolArnParam) {
      env[CI_ENV.CI_USER_POOL_ARN_PARAM] = params.userPoolArnParam;
    }

    if (options.includeAuthEnv && auth) {
      env[CI_ENV.CI_USER_POOL_ID] = auth.userPoolId;
      env[CI_ENV.CI_USER_POOL_ARN] = auth.userPoolArn;
    }

    return env;
  },

  /**
   * Direct per-handler overlay for auth-specific shaping.
   */
  resolveEnvMap: ({ region, envMode, options, extra }): CiFunctionEnvMap => {
    const auth = extra?.auth as CiCoreAuth | undefined;
    const params = options.authParams as CiCoreAuthParams | undefined;

    const env: CiFunctionEnvMap = {
      ciCreateCognitoUserHandler: {
        [CI_ENV.CI_REGION]: region,
        [CI_ENV.CI_ENV_MODE]: envMode,
        [CI_ENV.CI_USER_PROFILE_TABLE_NAME]: CI_ENV.CI_USER_PROFILE_TABLE_NAME,
        [CI_ENV.CI_USER_PROFILE_TABLE_ARN]: CI_ENV.CI_USER_PROFILE_TABLE_ARN,
      },
      ciGetCognitoUserHandler: {
        [CI_ENV.CI_REGION]: region,
        [CI_ENV.CI_ENV_MODE]: envMode,
      },
    };

    if (params?.userPoolIdParam) {
      env.ciCreateCognitoUserHandler![CI_ENV.CI_USER_POOL_ID_PARAM] = params.userPoolIdParam;
      env.ciGetCognitoUserHandler![CI_ENV.CI_USER_POOL_ID_PARAM] = params.userPoolIdParam;
    }

    if (params?.userPoolArnParam) {
      env.ciCreateCognitoUserHandler![CI_ENV.CI_USER_POOL_ARN_PARAM] = params.userPoolArnParam;
      env.ciGetCognitoUserHandler![CI_ENV.CI_USER_POOL_ARN_PARAM] = params.userPoolArnParam;
    }

    if (options.includeAuthEnv && auth) {
      env.ciCreateCognitoUserHandler![CI_ENV.CI_USER_POOL_ID] = auth.userPoolId;
      env.ciCreateCognitoUserHandler![CI_ENV.CI_USER_POOL_ARN] = auth.userPoolArn;
      env.ciGetCognitoUserHandler![CI_ENV.CI_USER_POOL_ID] = auth.userPoolId;
      env.ciGetCognitoUserHandler![CI_ENV.CI_USER_POOL_ARN] = auth.userPoolArn;
    }

    return env;
  },

  resolvePolicies: (): CiPolicyFragment => {
    return {};
  },
});
