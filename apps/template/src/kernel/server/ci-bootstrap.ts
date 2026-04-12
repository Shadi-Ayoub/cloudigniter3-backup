import { cache } from 'react';

import {
  ciBootstrap as _ciBootstrap,
  ciGetCurrentUser,
} from '@cloudigniter/next/server';

import {
  ciGetCookies,
  ciGetHeaders,
  ciGetTenantContext,
} from '@cloudigniter/next/utility/server';

import { ciNormalizeThrownError } from '@cloudigniter/next/utility';
import type {
  CiServerErrorPayload,
  CiAmplifyOutputs,
} from '@cloudigniter/next/types';

import { ciGetSettings } from '@/kernel/api/server';
import { ciGetServerStatus } from './ci-get-server-status';
import { ciGetSystemConfig } from '@/kernel/ci-get-system-config';

import outputs from '@/../amplify_outputs.json';

const amplifyOutputs = outputs as CiAmplifyOutputs;

export const ciBootstrap = cache(async () => {
  try {
    const tenantContext = await ciGetTenantContext();
    const config = await ciGetSystemConfig();
    const user = await ciGetCurrentUser(amplifyOutputs);

    const authMode = user.isAuthenticated
      ? ('userPool' as const)
      : config.data.publicAuthMode;

    const settings = await ciGetSettings({
      authMode,
      tenantId: tenantContext.tenantId,
      userId: user.userId ?? undefined,
      include:
        authMode === 'userPool' ? ['public', 'private', 'user'] : ['public'],
      userSettingIds: authMode === 'userPool' ? ['notifications'] : [],
    });

    const status = await ciGetServerStatus(settings, amplifyOutputs);
    const ciHeaders = await ciGetHeaders();
    const ciCookies = await ciGetCookies();

    return await _ciBootstrap(config, settings, ciHeaders, ciCookies, status);
  } catch (error) {
    const errorObj = ciNormalizeThrownError(error);

    if (errorObj.message === 'NEXT_REDIRECT') {
      throw error;
    }

    throw new Error(
      JSON.stringify({
        title: 'Bootstrapping CloudIgniter failed!',
        message: errorObj.message,
        severity: 'critical',
        showRetry: true,
      } satisfies CiServerErrorPayload)
    );
  }
});
