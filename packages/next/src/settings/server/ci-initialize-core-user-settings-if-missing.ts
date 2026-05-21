import { ciDefaultUserCoreSettings } from "@cloudigniter/core";

import type {
  CiInitializeCoreUserSettingsIfMissingResult,
  CiSettingsService,
} from "@cloudigniter/core/types";

type CiInitializeCoreUserSettingsIfMissingInput = {
  service: CiSettingsService;
  userId: string;
  tenantId?: string;
};

/**
 * Initialize core user settings only if a persisted user-level record
 * does not already exist.
 *
 * Behavior:
 * - checks for an existing user-scoped persisted record
 * - if found, does nothing
 * - if missing, seeds the default user core settings
 *
 * Notes:
 * - when tenantId is provided, user settings are initialized in tenant scope
 * - otherwise they are initialized in system scope
 */
export async function ciInitializeCoreUserSettingsIfMissing(
  input: CiInitializeCoreUserSettingsIfMissingInput,
): Promise<CiInitializeCoreUserSettingsIfMissingResult> {
  const existing = await input.service.get({
    settingsId: "core",
    tenantId: input.tenantId,
    userId: input.userId,
  });

  if (existing.layers?.user) {
    return {
      ok: true,
      initialized: false,
      settingsId: "core",
      scope: "user",
      tenantId: input.tenantId,
      userId: input.userId,
    };
  }

  await input.service.set({
    settingsId: "core",
    scope: "user",
    targetTenantScope: input.tenantId ? "tenant" : "system",
    tenantId: input.tenantId,
    userId: input.userId,
    value: ciDefaultUserCoreSettings,
  });

  return {
    ok: true,
    initialized: true,
    settingsId: "core",
    scope: "user",
    tenantId: input.tenantId,
    userId: input.userId,
  };
}
