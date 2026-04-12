import { cache } from 'react';

import {
  bootstrap as _bootstrap,
  getCurrentUser,
} from '@cloudigniter/next/server';

import {
  getCiCookies,
  getCiHeaders,
  getTenantContext,
} from '@cloudigniter/next/utility/server';

import { ciNormalizeThrownError } from '@cloudigniter/next/utility';
import type {
  CiServerErrorPayload,
  CiAmplifyOutputs,
} from '@cloudigniter/next/types';

import { getSettings } from '@/kernel/api/server';
import { getServerStatus } from './get-server-status';
import { getSystemConfig } from '@/kernel/get-system-config';

import outputs from '@/../amplify_outputs.json';

const amplifyOutputs = outputs as CiAmplifyOutputs;

// called by the root layout or each page route layout
export const bootstrap = cache(async () => {
  try {
    const tenantContext = await ciGetTenantContext();

    const config = await getSystemConfig();

    const user = await getCurrentUser(amplifyOutputs);

    const authMode = user.isAuthenticated
      ? ('userPool' as const)
      : config.data.publicAuthMode;

    const settings = await getSettings({
      authMode,
      tenantId: tenantContext.tenantId,
      userId: user.userId ?? undefined,
      include:
        authMode === 'userPool' ? ['public', 'private', 'user'] : ['public'],
      userSettingIds: ['preferences', 'notifications'], // user settings can be multiple
      categories: ['core', 'theme', 'navigation'], // TODO: decide the default categorie and merge with custom
    });

    const status = await getServerStatus(settings, amplifyOutputs);
    const ciHeaders = await getCiHeaders();
    const ciCookies = await getCiCookies();
    const pageConfig = await _bootstrap(
      config,
      settings,
      ciHeaders,
      ciCookies,
      status
    );

    return pageConfig;
  } catch (error) {
    const errorObj = ciNormalizeThrownError(error);
    if (errorObj.message === 'NEXT_REDIRECT') {
      // rethrow error! in case of redirect action!
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
