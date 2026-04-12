import type {
  CiPageConfig,
  CiConfigExtended,
  MainMenuItem,
  CiSettings,
  SettingsServiceDeps,
} from '@cloudigniter/next/types';
import { getSettings } from '@cloudigniter/next/server';
import { filterMainMenu } from '@cloudigniter/next/utility/client';

import { sanitizeSettingsForClient } from './settings/sanitize-settings-for-client';
import type { Shield } from './build-shield';

/**
 * Extract the private mainMenu (raw) from the resolved settings object.
 * It might not exist, so we keep it safe.
 */
function extractMainMenu(settings: CiSettings | undefined): MainMenuItem[] {
  const raw = (settings?.mainMenu ?? []) as unknown;
  return Array.isArray(raw) ? (raw as MainMenuItem[]) : [];
}

export type BuildPageConfigInput = {
  deps: SettingsServiceDeps;

  // tenant/user context
  tenantId: string;
  userId?: string;

  /**
   * Optional: permissions are often already in the ID token.
   * You can pass them to buildShield().
   */
  shield?: Shield;

  /**
   * Your existing CloudIgniter config payload (amplify outputs, theme props, i18n messages, etc.)
   */
  ciConfig: CiConfigExtended;
};

/**
 * Build the CloudIgniterPageConfig:
 * 1) Fetch settings with include ['system','tenant','user'] (if userId provided).
 * 2) Compute a filtered menu from the PRIVATE mainMenu.
 * 3) Attach it to the config for client rendering.
 */
export async function buildPageConfig(
  input: BuildPageConfigInput
): Promise<CiPageConfig> {
  const include = input.userId
    ? (['system', 'tenant', 'user'] as const)
    : (['system', 'tenant'] as const);

  const res = await getSettings(input.deps, {
    settingsId: 'core',
    tenantId: input.tenantId,
    userId: input.userId,
    include: [...include],
  });

  // If settings retrieval fails, still return config without settings/menu
  if (!res.ok) {
    return {
      ciConfig: input.ciConfig,
      settings: undefined,
      menu: [],
      //   status: { settingsError: res.body.error },
    };
  }

  const resolved = res.body.resolved;

  // mainMenu should live in private settings; resolved includes private layers too (server-side only)
  const rawMenu = extractMainMenu(resolved);

  // Filter by Shield permissions; if no shield is passed, the filter defaults to allow-all.
  const filteredMenu = filterMainMenu(rawMenu, {
    canAccess: (url) => input.shield?.canAccessPath(url) ?? true,
    allowCategoryNodes: true,
  });

  // after you compute resolved + filteredMenu
  const safeSettings = sanitizeSettingsForClient(resolved, {
    includeDerived: true,
    includeMenuInSettings: false, // recommended: keep menu separate in config.menu
  });

  // Return config. Important:
  // - Send filtered menu to client.
  // - It’s OK to send resolved settings too, but many teams prefer stripping private parts.
  //   If you want, I can add `sanitizeSettingsForClient()`.
  return {
    ciConfig: input.ciConfig,
    settings: safeSettings,
    menu: filteredMenu,
  };
}
