import { CloudIgniterPageWrapper } from '@CI/provider';
import type { CiPageConfig } from '@CI/types';

import { AuthProvider } from '@CI/provider/client/AuthProvider';

import { LoginPageClientWrapper } from './client-wrapper';

interface LoginPageInterface {
  config: CiPageConfig;
}
export function LoginPage({ config }: LoginPageInterface) {
  const authenticatorProps = config.ciConfig.authenticatorProps;
  const authenticatorStyleTheme = config.ciConfig.authenticatorStyleTheme;

  return (
    <CloudIgniterPageWrapper config={config} protect={false}>
      <AuthProvider>
        <LoginPageClientWrapper
          authenticatorProps={authenticatorProps}
          authenticatorStyleTheme={authenticatorStyleTheme}
        />
      </AuthProvider>
    </CloudIgniterPageWrapper>
  );
}
