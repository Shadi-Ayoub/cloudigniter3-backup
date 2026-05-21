import { ciDefaultPrivateCoreSettings } from "@cloudigniter/core";
import { type CiSeedCorePrivateSettingsInput } from "@cloudigniter/core/types";

/**
 * Seed core private settings into persisted storage.
 */
export async function ciSeedCorePrivateSettings(
  input: CiSeedCorePrivateSettingsInput,
): Promise<void> {
  await input.service.set({
    settingsId: "core",
    scope: "private",
    targetTenantScope: input.targetTenantScope ?? "system",
    tenantId: input.tenantId,
    value: ciDefaultPrivateCoreSettings,
  });
}
