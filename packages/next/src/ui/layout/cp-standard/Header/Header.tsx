import React from 'react';

import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

interface HeaderInterface {
  config: CiPageConfig;
  children: React.ReactNode;
}

const Header = ({ config, children }: HeaderInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(config.ciConfig.traceLog, { source: 'server', prettyWave: true }, { name: 'Header' });

  logger.log({
    type: 'component',
    name: 'Header',
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
