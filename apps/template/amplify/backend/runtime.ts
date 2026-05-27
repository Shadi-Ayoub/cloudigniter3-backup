import type { CiCoreRuntime } from '@cloudigniter/next/server/backend';

import type { CiBackend } from './types';
import { ciGetAuthStack } from './auth';
import { ciGetDataStack } from './data';

export const ciGetRuntimeStack = (
  backend: CiBackend,
  input: {
    auth: ReturnType<typeof ciGetAuthStack>;
    data: ReturnType<typeof ciGetDataStack>;
  }
): CiCoreRuntime => {
  const envMode = process.env.CI_ENV_MODE ?? 'live';
  const region = backend.stack.region;

  return {
    envMode,
    region,
    resources: {
      privateSettingsTable: input.data.tables.privateSettingsTable,
      publicSettingsTable: input.data.tables.publicSettingsTable,
      systemTable: input.data.tables.systemTable,
      userProfileTable: input.data.tables.userProfileTable,
      userSettingsTable: input.data.tables.userSettingsTable,
      auth: {
        enabled: true,
      },
    },
  };
};
