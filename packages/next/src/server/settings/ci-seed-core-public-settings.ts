import { ciDefaultPublicCoreSettings } from "@cloudigniter/core/lib";
import { type CiSeedCorePublicSettingsInput } from "@cloudigniter/core/types";

/**
 * Seed core public settings into persisted storage.
 *
 * Note:
 * - public defaults already exist via the registry
 * - this helper is useful when you want a persisted baseline record
 */
export async function ciSeedCorePublicSettings(
  input: CiSeedCorePublicSettingsInput,
): Promise<void> {
  await input.service.set({
    settingsId: "core",
    scope: "public",
    targetTenantScope: input.targetTenantScope ?? "system",
    tenantId: input.tenantId,
    value: ciDefaultPublicCoreSettings,
  });
}
