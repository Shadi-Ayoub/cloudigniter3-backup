import React from 'react';
import { useTranslations } from 'next-intl';

import { capitalizeFirstLetter } from '@CI/utility/common/capitalize-first-letter';
import { SystemStatusDialog } from './SystemStatusDialog';
import { startTrace } from '@CI/trace';
import type { CiPageConfig, SystemStatusCheckList } from '@CI/types';

interface FooterInterface {
  config: CiPageConfig;
  checkList: SystemStatusCheckList;
  children: React.ReactNode;
}

const Footer = ({ config, checkList, children }: FooterInterface) => {
  const t = useTranslations('mainFooter');

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(config.ciConfig.traceLog, { source: 'server', prettyWave: true }, { name: '<Footer>' });

  logger.log({
    scope: 'layout',
    event: `Rendering the <Footer> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <footer className='ci-main-footer'>
      <div className='flex-1 text-left'>
        <SystemStatusDialog checkList={checkList} />
      </div>

      <div style={{ flex: 1, textAlign: 'center' }}>
        <span>{children}</span>
      </div>

      <div className='flex-1 text-right'>
        <span>{capitalizeFirstLetter(t('environment'))}:</span>&nbsp;
        <span className='text-secondary-400'>{t(process.env.NODE_ENV)}</span>
      </div>
    </footer>
  );
};

export default Footer;
