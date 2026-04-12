import { MainHeaderNavigationBox } from '@CI/ui/components';
import { MainHeaderUserBox } from '@CI/ui/components';
import { CloudIgniterPageWrapper } from '@CI/provider';
import { Header } from './Header';
import { Container } from './Container';
import { Copyright, Footer } from './Footer';
import { HeaderLogo } from '@CI/ui/components';
import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

interface LayoutProps {
  config: CiPageConfig;
  protect?: boolean;
  children: React.ReactNode;
}

export default function Layout({ config, protect = true, children }: LayoutProps) {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(config.ciConfig.traceLog, { source: 'server', prettyWave: true }, { name: 'Layout' });

  logger.log({
    type: 'component',
    name: 'Layout',
    scope: 'layout',
    event: `Rendering the <Layout> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <CloudIgniterPageWrapper config={config} protect={protect}>
      <main className='ci-main'>
        <Header config={config}>
          <MainHeaderNavigationBox config={config} />
          <HeaderLogo config={config} />
          <MainHeaderUserBox config={config} />
        </Header>
        <Container config={config}>{children}</Container>
        <Footer
          checkList={{
            amplifyOutputs: config.ciConfig.amplifyOutputs,
            settings: config.settings,
            status: config.status,
          }}
          config={config}
        >
          <Copyright />
        </Footer>
      </main>
    </CloudIgniterPageWrapper>
  );
}
