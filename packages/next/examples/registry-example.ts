import { ciDefineSettingsRegistry } from '../packages/next/src/settings/common/ci-define-settings-registry';

/**
 * Example public core settings type.
 */
type AppPublicSettings = {
  applicationName: string;
  features: {
    enableTraceBeacon: boolean;
  };
};

/**
 * Example settings registry.
 */
export const ciSettingsRegistry = ciDefineSettingsRegistry({
  core: {
    scope: 'public',
    defaults: {
      applicationName: 'CloudIgniter',
      features: {
        enableTraceBeacon: false,
      },
    } satisfies AppPublicSettings,
    allowClientRead: true,
    schema: {
      parse(value) {
        return value as AppPublicSettings;
      },
    },
    meta: {
      title: 'Core Public Settings',
      description: 'Public application settings.',
      category: 'core',
      tags: ['public', 'core'],
    },
  },
});
