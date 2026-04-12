'use client';

// export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';

// import { deepmerge } from 'deepmerge-ts';

// import { getSettings } from '../../../server';
import { NextIntlClientProvider, useLocale, useMessages } from 'next-intl';
import { SettingsForm } from '@CI/settings';
import type { SettingsPageProps } from '@CI/types';
// import { isEmptyObject } from '../../../utility';
// import { settingsDefaultValues } from '../../../settings';

export const SettingsPage = ({ input }: SettingsPageProps) => {
  try {
    const formValues = input.settings;
    const locale = useLocale();
    const messages = useMessages();

    // const settings = await getSettings();

    // if (isEmptyObject(input.settings.general)) {
    //   // In the rare case of empty settings. Defaults will be considered!
    //   // This is why the extended default settings are passed by the application.
    //   formValues = deepmerge(settingsDefaultValues, input.values as Settings);
    // } else {
    //   formValues = settings;
    // }

    const sanitizedValues = JSON.parse(
      JSON.stringify({
        ...input.values,
        ...formValues,
      })
    );

    const input2 = {
      input: {
        settings: sanitizedValues,
        submitUrl: '/dashboard/settings/save',
        extendedZodSchema: input.extendedZodSchema,
        extendedTabs: input.extendedTabs,
        direction: input.direction,
      },
    };

    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SettingsForm {...input2} />
      </NextIntlClientProvider>
    );
  } catch (error) {
    throw error;
  }
};
