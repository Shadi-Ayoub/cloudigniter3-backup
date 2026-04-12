import React from 'react';

import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

interface ContentInterface {
  config: CiPageConfig;
  children: React.ReactNode;
}

const Container: React.FC<ContentInterface> = ({ config, children }) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(
    config.ciConfig.traceLog,
    { source: 'server', prettyWave: true },
    { name: '<Container>' }
  );

  logger.log({
    scope: 'layout',
    event: `Rendering the <Container> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return <div className='ci-container'>{children}</div>;
};

export default Container;
