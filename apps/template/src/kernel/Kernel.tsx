import '@aws-amplify/ui-react/styles.css';

import { startTrace } from '@cloudigniter/next/trace';

import { getConfig } from '@/kernel';

import '@cloudigniter/next/styles/standard.css';
import '../custom/authenticator/authenticator.css';

const Kernel = () => {
  const config = getConfig('<Kernel>');

  /////////////////////////////////////////////////////////////////////////////////////////Log trace
  const { logger } = startTrace(
    config.traceLog,
    { source: 'server', prettyWave: true },
    { name: 'Kernel: Boot' }
  );

  logger.log({ scope: 'kernel', event: 'Rendering the <Kernel> component' });
  //////////////////////////////////////////////////////////////////////////////////////////////////

  return null;
};

export default Kernel;
