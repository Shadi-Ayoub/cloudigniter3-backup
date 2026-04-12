import React from 'react';
import { useTranslations } from 'next-intl';

import { startTrace } from '@CI/trace';
import { capitalizeFirstLetter } from '@CI/utility/common/capitalize-first-letter';
import type { CiPageConfig } from '@CI/types';

interface FooterProps {
  config: CiPageConfig;
  children: React.ReactNode;
}

const Footer: React.FC<FooterProps> = ({ config, children }) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(config.ciConfig.traceLog, { source: 'server', prettyWave: true }, { name: '<Footer>' });

  logger.log({
    scope: 'layout',
    event: `Rendering the <Footer> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  const t = useTranslations('mainFooter');

  return (
    <footer className='ci-main-footer'>
      <div className='ci-main-footer-left'>
        <span>Left Column</span>
      </div>

      <div className='ci-main-footer-center'>
        <span>{children}</span>
      </div>

      <div className='ci-main-footer-right'>
        <span>{capitalizeFirstLetter(t('environment'))}:</span>&nbsp;
        <span className='ci-main-footer-env-text'>{t(process.env.NODE_ENV)}</span>
      </div>
    </footer>
  );
};

export default Footer;
