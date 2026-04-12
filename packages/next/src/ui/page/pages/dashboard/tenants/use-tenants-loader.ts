'use client';

import { useCallback, useEffect, useState } from 'react';

import { ciNormalizeThrownError } from '@cloudigniter/next/utility';

import { call, consolePrint, getEnvMode, isCiResponse, notify, safeToString } from '@CI/utility';

import type { CiTenant, CiRequest, CiResponse } from '@CI/types';
import type { LoadTenantsInput, LoadTenantsOkBody, LoadTenantsErrorBody } from './types';

function isLoadTenantsOkBody(x: unknown): x is LoadTenantsOkBody {
  if (!x || typeof x !== 'object') return false;
  const o = x as any;
  return Array.isArray(o.items) && typeof o.count === 'number';
}

function getErrMsg(errBody: unknown): string {
  const anyBody = errBody as any;
  return (
    anyBody?.error?.toString?.() ?? (typeof anyBody?.error === 'string' ? anyBody.error : null) ?? 'CiRequest failed.'
  );
}

export function useTenantsLoader(setLoading: (v: boolean, text?: string) => void) {
  const [tenants, setTenants] = useState<CiTenant[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTenants = useCallback(async () => {
    setLoading(true, 'Loading tenants. Please wait...');
    setErrorMsg(null);

    const envMode = getEnvMode();

    const request: CiRequest<LoadTenantsInput> = {
      input: { includeDisabled: false },
      envMode,
    };

    try {
      const result = await call<LoadTenantsInput, CiResponse<LoadTenantsOkBody, LoadTenantsErrorBody>>(
        '/dashboard/tenants/list',
        request
      );

      if (!result.ok) {
        const errMsg = result.message ?? 'Unexpected error while loading tenants.';
        setErrorMsg(errMsg);
        notify('error', errMsg);
        return;
      }

      const respUnknown = result.response;

      if (!isCiResponse<LoadTenantsOkBody, LoadTenantsErrorBody>(respUnknown)) {
        const errMsg = `Unexpected response shape: ${safeToString(respUnknown)}`;
        setErrorMsg(errMsg);
        notify('error', errMsg);
        return;
      }

      const statusCode = respUnknown.statusCode ?? 200;

      if (statusCode < 400 && isLoadTenantsOkBody(respUnknown.body)) {
        setTenants(respUnknown.body.items);

        consolePrint({
          label: 'Tenants loaded:',
          message: respUnknown.body as object,
          options: { format: 'JSON', messageType: 'SUCCESS' },
        });
      } else if (statusCode >= 400) {
        const msg = getErrMsg(respUnknown.body);
        setErrorMsg(msg);
        notify('error', msg);
      } else {
        const msg = `Unexpected OK body shape: ${safeToString(respUnknown.body)}`;
        setErrorMsg(msg);
        notify('error', msg);
      }
    } catch (error: unknown) {
      const normalized = ciNormalizeThrownError(error);
      const errMsg = `Unexpected error while loading tenants! ${normalized.message}`;
      setErrorMsg(errMsg);
      notify('error', errMsg);

      consolePrint({
        label: '[TenantsPage] Load tenants error:',
        message: error as string,
        options: { messageType: 'ERROR' },
      });
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  useEffect(() => {
    // load on mount
    void loadTenants();
  }, [loadTenants]);

  return { tenants, setTenants, loadTenants, errorMsg };
}
