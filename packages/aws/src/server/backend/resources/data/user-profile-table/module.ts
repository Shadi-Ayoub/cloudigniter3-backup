import { CI_ENV } from '../../../env/env.keys';
import { ciCreateResourceModule } from '../../resource-module.helpers';
import type { CiTableResourceState } from '../../resource-types';
import { USER_PROFILE_TABLE_HANDLERS } from './handlers';
import { ciMakeUserProfileTablePolicies } from './policy';

const USER_PROFILE_TABLE_ENV_KEYS = [CI_ENV.CI_USER_PROFILE_TABLE_NAME, CI_ENV.CI_USER_PROFILE_TABLE_ARN] as const;

export const ciUserProfileTableResourceModule = ciCreateResourceModule({
  id: 'userProfileTable',
  kind: 'table',
  handlers: USER_PROFILE_TABLE_HANDLERS,
  envKeyAllowlist: {
    ciGetUserProfileHandler: [...USER_PROFILE_TABLE_ENV_KEYS],
    ciCreateUserProfileHandler: [...USER_PROFILE_TABLE_ENV_KEYS],
    ciUpdateUserProfileHandler: [...USER_PROFILE_TABLE_ENV_KEYS],
    ciDeleteUserProfileHandler: [...USER_PROFILE_TABLE_ENV_KEYS],
  } as const satisfies Partial<Record<(typeof USER_PROFILE_TABLE_HANDLERS)[number], readonly string[]>>,
  resolveEnvValues: ({ resource }: { resource: CiTableResourceState }) => ({
    [CI_ENV.CI_USER_PROFILE_TABLE_NAME]: resource.name,
    [CI_ENV.CI_USER_PROFILE_TABLE_ARN]: resource.arn,
  }),
  resolvePolicies: ({ resource, options }) => ciMakeUserProfileTablePolicies({ userProfile: resource }, options),
});
