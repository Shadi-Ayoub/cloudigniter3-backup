import type { SettingsServiceDeps } from '@cloudigniter/next/types';
import { setSettings } from '@cloudigniter/next/server';
import { ciDefaultPublicSettings } from '@cloudigniter/next/server';
import { ciDefaultPrivateSettings } from '@cloudigniter/next/server';

/**
 * Seed system defaults for "core":
 * - public defaults go to system/public
 * - private defaults go to system/private
 *
 * Call this:
 * - during installation
 * - or via an admin-only CLI/task runner
 */
export async function seedCoreSettings(deps: SettingsServiceDeps) {
  // system/public
  await setSettings(deps, {
    scope: 'system',
    visibility: 'public',
    settingsId: 'core',
    patch: ciDefaultPublicSettings,
  });

  // system/private
  await setSettings(deps, {
    scope: 'system',
    visibility: 'private',
    settingsId: 'core',
    patch: ciDefaultPrivateSettings,
  });
}
