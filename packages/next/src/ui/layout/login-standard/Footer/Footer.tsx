import React from 'react';
// import { useTranslations } from 'next-intl';

import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

interface FooterInterface {
  config: CiPageConfig;
  // checkList: SystemStatusCheckList;
  children: React.ReactNode;
}

const Footer = ({ config, children }: FooterInterface) => {
  // const t = useTranslations('mainFooter');

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(config.ciConfig.traceLog, { source: 'server', prettyWave: true }, { name: '<Footer>' });

  logger.log({
    scope: 'layout',
    event: `Rendering the <Footer> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <footer className='ci-main-login-footer'>
      <div style={{ textAlign: 'center' }}>
        <span>{children}</span>
      </div>
    </footer>
  );
};

export default Footer;
