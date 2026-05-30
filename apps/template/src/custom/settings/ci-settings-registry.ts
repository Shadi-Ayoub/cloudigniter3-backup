import { z } from "zod";

import {
  CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID,
  CI_DEFAULT_PUBLIC_CORE_SETTINGS_ID,
  CI_DEFAULT_USER_CORE_SETTINGS_ID,
  ciDefaultPrivateCoreSettings,
  ciDefaultPublicCoreSettings,
  ciDefaultUserCoreSettings,
  CiPrivateCoreSettingsSchema,
  CiPublicCoreSettingsSchema,
  CiUserCoreSettingsSchema,
} from "@cloudigniter/core/lib";

import type {
  CiSettings,
  CiSettingsDefinition,
  CiSettingsRegistry,
  CiSettingsScope,
  CiSettingsId,
  CiSettingsRegistryEntry,
  CiSettingsRegistryMap,
} from "@cloudigniter/core/lib";

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
  source?: "public" | "private" | "user";
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
      scope: "public",
      defaults: ciDefaultPublicCoreSettings,
      schema: CiPublicCoreSettingsSchema,
    },

    [CI_DEFAULT_PRIVATE_CORE_SETTINGS_ID]: {
      scope: "private",
      defaults: ciDefaultPrivateCoreSettings,
      schema: CiPrivateCoreSettingsSchema,
    },

    [CI_DEFAULT_USER_CORE_SETTINGS_ID]: {
      scope: "user",
      defaults: ciDefaultUserCoreSettings,
      schema: CiUserCoreSettingsSchema,
    },

    notifications: {
      scope: "user",
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

  const entries: CiSettingsRegistryMap = {};

  for (const [settingsId, entry] of Object.entries(templateRegistry)) {
    entries[settingsId] = {
      scope: entry.scope,
      defaults: entry.defaults,
      meta: entry.meta,
    };
  }

  return {
    entries,

    get(settingsId: CiSettingsId): CiSettingsRegistryEntry {
      const entry = entries[settingsId];

      if (!entry) {
        throw new Error(`Settings registry entry not found: ${settingsId}`);
      }

      return entry;
    },

    list(): CiSettingsRegistryMap {
      return entries;
    },

    listByScope(scope: CiSettingsScope): CiSettingsRegistryMap {
      return Object.fromEntries(
        Object.entries(entries).filter(([, entry]) => entry.scope === scope),
      ) as CiSettingsRegistryMap;
    },
  };
}
