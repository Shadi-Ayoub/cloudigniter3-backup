'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Authenticator,
  ThemeProvider,
  useAuthenticator,
  type AuthenticatorProps,
  type Theme,
} from '@aws-amplify/ui-react';

import { defaultAuthenticatorStyleTheme } from '@CI/provider/client/default-authenticator-style-theme';
import { Spinner } from '@CI/ui/components';

export interface LoginPageClientWrapperInterface {
  authenticatorProps: AuthenticatorProps;
  authenticatorStyleTheme?: () => Theme;
}

export function LoginPageClientWrapper({
  authenticatorProps,
  authenticatorStyleTheme,
}: LoginPageClientWrapperInterface) {
  const router = useRouter();

  const theme = authenticatorStyleTheme ?? defaultAuthenticatorStyleTheme;

  // react to auth state instead of onAuthEvent
  const { authStatus } = useAuthenticator((ctx) => [ctx.authStatus]);

  const params = useSearchParams();
  // read the original target (/login?next=/cp/settings)
  const rawNext = params.get('next') || '/dashboard';
  const nextSafe = useMemo(() => (rawNext.startsWith('/dashboard') ? rawNext : '/dashboard'), [rawNext]);

  // const { setLoading } = usePageLoader();

  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.push(nextSafe);
    }
  }, [authStatus, nextSafe, router]);

  return (
    <ThemeProvider theme={theme}>
      <Authenticator {...authenticatorProps} className='px-4 pt-8 pb-8'>
        <Spinner text={'Loading...'} />
      </Authenticator>
    </ThemeProvider>
  );
}
