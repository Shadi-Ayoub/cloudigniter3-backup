'use client';

import { type FC } from 'react';
import { DashboardCard as Card } from '@CI/ui/components';
import { DashboardGrid } from '@CI/ui/components';
import { type DashboardCard } from '@CI/types';
import { PageLoader } from '@CI/ui/layout';

// import { NextIntlClientProvider, useLocale, useMessages } from 'next-intl';

interface DashboardProps {
  config: DashboardCard[];
}

export const DevToolsPage: FC<DashboardProps> = ({ config }) => {
  // const messages = useMessages();
  // const locale = useLocale();

  return (
    <>
      <PageLoader />
      {/* <NextIntlClientProvider locale={locale} messages={messages}> */}
      <DashboardGrid>
        {config.map((card, index) => (
          <Card
            key={index}
            id={card.id}
            icon={card.icon}
            route={card.route}
            label={card.label}
            namespace={card.namespace}
          />
        ))}
      </DashboardGrid>
      {/* </NextIntlClientProvider> */}
    </>
  );
};
