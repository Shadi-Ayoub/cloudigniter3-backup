import { useTranslations } from 'next-intl';

import { capitalizeFirstLetter } from '@CI/utility/common/capitalize-first-letter';
import { startTrace } from '@CI/trace';
import type { CiPageConfig } from '@CI/types';

interface CopyrightInterface {
  config: CiPageConfig;
}

const Copyright = ({ config }: CopyrightInterface) => {
  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(
    config.ciConfig.traceLog,
    { source: 'server', prettyWave: true },
    { name: '<Copyright>' }
  );

  logger.log({
    scope: 'layout',
    event: `Rendering the <Copyright> component`,
  });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  const t = useTranslations('mainFooter');

  return (
    <p className='text-sm'>
      &copy; {new Date().getFullYear()} Cloudigniter. {capitalizeFirstLetter(t('all rights reserved'), true)}
    </p>
  );
};

export { Copyright };
