import { ciDefaultUserCoreSettings } from "@cloudigniter/core/lib";
import { type CiSeedCoreUserSettingsInput } from "@cloudigniter/core/types";

/**
 * Seed core user settings for one specific user.
 *
 * This is typically called during user initialization rather than
 * as a one-time system bootstrap.
 */
export async function ciSeedCoreUserSettings(
  input: CiSeedCoreUserSettingsInput,
): Promise<void> {
  await input.service.set({
    settingsId: "core",
    scope: "user",
    targetTenantScope: input.tenantId ? "tenant" : "system",
    tenantId: input.tenantId,
    userId: input.userId,
    value: ciDefaultUserCoreSettings,
  });
}
