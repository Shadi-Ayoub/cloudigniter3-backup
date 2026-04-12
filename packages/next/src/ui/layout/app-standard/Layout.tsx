import React from 'react';

import { HeaderDashboardButton } from '@CI/ui/components';
import { MainHeaderUserBox } from '@CI/ui/components';
import { CloudIgniterPageWrapper } from '@CI/provider';
import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

import { Header } from './Header';
import { Container } from './Container';
import { Copyright, Footer } from './Footer';

interface LayoutProps {
  config: CiPageConfig;
  protect: boolean;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ config, protect, children }: LayoutProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(config.ciConfig.traceLog, { source: 'server', prettyWave: true }, { name: '<Layout>' });

  logger.log({
    scope: 'layout',
    event: `Rendering the <Layout> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <CloudIgniterPageWrapper config={config} protect={protect}>
      <Header config={config}>
        <HeaderDashboardButton config={config} />
        <div></div>
        <MainHeaderUserBox config={config} />
      </Header>
      <Container config={config}>{children}</Container>
      <Footer config={config}>
        <Copyright config={config} />
      </Footer>
    </CloudIgniterPageWrapper>
  );
};

export default Layout;
