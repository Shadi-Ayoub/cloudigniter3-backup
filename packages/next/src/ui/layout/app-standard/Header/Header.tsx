import React from 'react';

import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

interface HeaderProps {
  config: CiPageConfig;
  children: React.ReactNode;
}

const Header = ({ config, children }: HeaderProps) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(config.ciConfig.traceLog, { source: 'server', prettyWave: true }, { name: '<Header>' });

  logger.log({
    scope: 'layout',
    event: `Rendering the <Header> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////
  return (
    <header dir='ltr' className='ci-main-header'>
      {children}
    </header>
  );
};

export default Header;
