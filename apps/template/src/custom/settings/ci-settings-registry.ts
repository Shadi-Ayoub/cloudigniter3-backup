import { z } from 'zod';

import {
  ciDefaultPrivateCoreSettings,
  ciDefaultPublicCoreSettings,
  ciDefaultUserCoreSettings,
} from '@cloudigniter/next/settings';

import type {
  CiSettings,
  CiSettingsDefinition,
  CiSettingsRegistry,
} from '@cloudigniter/next/settings';

import {
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
} from '@cloudigniter/next/constants';

import {
  CiPrivateCoreSettingsSchema,
  CiPublicCoreSettingsSchema,
  CiUserCoreSettingsSchema,
} from '@cloudigniter/next/schemata';

/* -------------------------------------------------------------------------- */
/* Local template registry extensions                                         */
/* -------------------------------------------------------------------------- */

const NotificationsSettingsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
});

export type CiTemplateSettingsRegistryEntry = CiSettingsDefinition & {
  schema?: z.ZodTypeAny;
  mergeWithCore?: boolean;
  source?: 'public' | 'private' | 'user';
  routes?: string[];
};

export type CiTemplateSettingsRegistry = Record<
  string,
  CiTemplateSettingsRegistryEntry
>;

/* -------------------------------------------------------------------------- */
/* Registry builder                                                           */
/* -------------------------------------------------------------------------- */

export function ciBuildSettingsRegistry(): CiTemplateSettingsRegistry {
  const registry: CiTemplateSettingsRegistry = {
    [CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID]: {
      scope: 'public',
      defaults: ciDefaultPublicCoreSettings,
      schema: CiPublicCoreSettingsSchema,
    },

    [CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID]: {
      scope: 'private',
      defaults: ciDefaultPrivateCoreSettings,
      schema: CiPrivateCoreSettingsSchema,
    },

    [CI_DEFAULT_USER_CORE_SETTINGS_ID]: {
      scope: 'user',
      defaults: ciDefaultUserCoreSettings,
      schema: CiUserCoreSettingsSchema,
    },

    notifications: {
      scope: 'user',
      defaults: {
        email: true,
        push: false,
      } satisfies CiSettings,
      schema: NotificationsSettingsSchema,
      mergeWithCore: true,
    },

    // adminTools: {
    //   scope: 'route',
    //   source: 'private',
    //   routes: ['/cp/admin/*'],
    //   defaults: {
    //     showAuditPanel: true,
    //   },
    //   schema: z.object({
    //     showAuditPanel: z.boolean(),
    //   }),
    // },

    // dashboardPreferences: {
    //   scope: 'route',
    //   source: 'user',
    //   routes: ['/dashboard/*'],
    //   defaults: {
    //     widgetsCollapsed: false,
    //   },
    //   schema: z.object({
    //     widgetsCollapsed: z.boolean(),
    //   }),
    // },
  };

  return registry;
}

/* -------------------------------------------------------------------------- */
/* Optional helper when a strict service registry is needed                   */
/* -------------------------------------------------------------------------- */

export function ciBuildServiceSettingsRegistry(): CiSettingsRegistry {
  const templateRegistry = ciBuildSettingsRegistry();
  const serviceRegistry: CiSettingsRegistry = {};

  for (const [settingsId, entry] of Object.entries(templateRegistry)) {
    serviceRegistry[settingsId] = {
      scope: entry.scope,
      defaults: entry.defaults,
      meta: entry.meta,
    };
  }

  return serviceRegistry;
}
