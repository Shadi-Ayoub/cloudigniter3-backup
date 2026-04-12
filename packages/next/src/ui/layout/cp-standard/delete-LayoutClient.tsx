import { Toaster } from 'sonner';
import { MainHeaderNavigationBox } from '@CI/ui/components';
import { MainHeaderUserBox } from '@CI/ui/components';
import { CloudIgniterPageWrapper } from '@CI/provider';
import { Header } from './Header';
import { Container } from './Container';
import { Copyright, Footer } from './Footer';
import { HeaderLogo } from '@CI/ui/components';
import type { CiPageConfig } from '@CI/types';

interface LayoutProps {
  config: CiPageConfig;
  protect: boolean;
  children: React.ReactNode;
}

export const LayoutClient: React.FC<LayoutProps> = ({ config, protect, children }) => {
  return (
    <CloudIgniterPageWrapper config={config} protect={protect}>
      <main className='ci-main'>
        <Header>
          <MainHeaderNavigationBox config={config} />
          <HeaderLogo />
          <MainHeaderUserBox config={config} />
        </Header>
        <Container>{children}</Container>
        <Footer
          checkList={{
            amplifyOutputs: config.ciConfig.amplifyOutputs,
            settings: config.settings,
            status: config.status,
          }}
        >
          <Copyright />
        </Footer>
        <Toaster position='top-center' />
      </main>
    </CloudIgniterPageWrapper>
  );
};
