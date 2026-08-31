import { ciCreateResourceModule } from "../resource-module.helpers";
import { CI_ENV } from "../../env/env.keys";
import { CI_AUTH_FUNCS_IDS } from "../../core-types/functions";

import type { CiCoreAuth, CiCoreAuthParams } from "../../core-types/auth";
import type { CiPolicyFragment } from "../../core-types/policy";

export const ciAuthResourceModule = ciCreateResourceModule({
  id: "auth",
  kind: "auth",
  status: "active",
  handlers: CI_AUTH_FUNCS_IDS,

  envKeyAllowlist: {
    ciDeleteCognitoUserHandler: [
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
    ciCreateCognitoUserHandler: [
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
    ciGetCognitoUserHandler: [
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
    ciListCognitoUsersHandler: [
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
    ciSetCognitoUserEnabledHandler: [
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
    ciSetCognitoUserPasswordHandler: [
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
    ciUpdateCognitoUserHandler: [
      CI_ENV.CI_USER_POOL_ID_PARAM,
      CI_ENV.CI_USER_POOL_ARN_PARAM,
      CI_ENV.CI_USER_POOL_ID,
      CI_ENV.CI_USER_POOL_ARN,
    ],
  },

  /**
   * Flat values contributed by auth/resource context.
   */
  resolveEnvValues: ({ options, extra }) => {
    const auth = extra?.auth as CiCoreAuth | undefined;
    const params = options.authParams as CiCoreAuthParams | undefined;

    const env: Record<string, string> = {};

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

  resolvePolicies: (): CiPolicyFragment => {
    return {};
  },
});
