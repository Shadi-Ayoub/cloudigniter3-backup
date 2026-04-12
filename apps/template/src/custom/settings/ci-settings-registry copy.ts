import { z } from 'zod';

import {
  ciCreateSettingsRegistry,
  ciDefaultPrivateCoreSettings,
  ciDefaultPublicCoreSettings,
  ciDefaultUserCoreSettings,
  ciRegisterSettings,
} from '@cloudigniter/next/server';
import {
  CiPrivateCoreSettingsSchema,
  CiPublicCoreSettingsSchema,
  CiUserCoreSettingsSchema,
} from '@cloudigniter/next/schemata';
import {
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
} from '@cloudigniter/next/constants';

import type { CiSettingsRegistry } from '@cloudigniter/next/types';

const NotificationsSettingsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* Module augmentation                                                        */
/* -------------------------------------------------------------------------- */

declare module '@cloudigniter/next/types' {
  interface CiSettingsRegistryMap {
    notifications: {
      defaults: z.infer<typeof NotificationsSettingsSchema>;
      schema: typeof NotificationsSettingsSchema;
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Registry builder                                                           */
/* -------------------------------------------------------------------------- */

export function ciBuildSettingsRegistry(): CiSettingsRegistry {
  const registry = ciCreateSettingsRegistry();

  // PUBLIC CORE
  ciRegisterSettings(registry, CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID, {
    scope: 'public',
    defaults: ciDefaultPublicCoreSettings,
    schema: CiPublicCoreSettingsSchema,
  });

  // PRIVATE CORE
  ciRegisterSettings(registry, CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID, {
    scope: 'private',
    defaults: ciDefaultPrivateCoreSettings,
    schema: CiPrivateCoreSettingsSchema,
  });

  // USER CORE
  ciRegisterSettings(registry, CI_DEFAULT_USER_CORE_SETTINGS_ID, {
    scope: 'user',
    defaults: ciDefaultUserCoreSettings,
    schema: CiUserCoreSettingsSchema,
  });

  // USER EXTENDED
  ciRegisterSettings(registry, 'notifications', {
    scope: 'user',
    defaults: {
      email: true,
      push: false,
    },
    schema: NotificationsSettingsSchema,
    // optional; now defaults to true for custom public/private/user settings
    mergeWithCore: true,
  });

  // ROUTE SETTINGS FROM PRIVATE STORE
  // ciRegisterSettings(registry, 'adminTools', {
  //   scope: 'route',
  //   source: 'private',
  //   routes: ['/cp/admin/*'],
  //   defaults: {
  //     showAuditPanel: true,
  //   },
  //   schema: z.object({
  //     showAuditPanel: z.boolean(),
  //   }),
  // });

  // // ROUTE SETTINGS FROM USER PROFILE
  // ciRegisterSettings(registry, 'dashboardPreferences', {
  //   scope: 'route',
  //   source: 'user',
  //   routes: ['/dashboard/*'],
  //   defaults: {
  //     widgetsCollapsed: false,
  //   },
  //   schema: z.object({
  //     widgetsCollapsed: z.boolean(),
  //   }),
  // });

  return registry;
}
