import type { CiSeedCoreSettingsInput } from "@cloudigniter/core/types";
import { ciSeedCorePrivateSettings } from "./ci-seed-core-private-settings";
import { ciSeedCorePublicSettings } from "./ci-seed-core-public-settings";

/**
 * Seed core public/private settings into persisted storage.
 *
 * User defaults are intentionally excluded because they are normally
 * initialized per user.
 */
export async function ciSeedCoreSettings(
  input: CiSeedCoreSettingsInput,
): Promise<void> {
  if (input.includePublic ?? true) {
    await ciSeedCorePublicSettings({
      service: input.service,
      targetTenantScope: input.targetTenantScope,
      tenantId: input.tenantId,
    });
  }

  if (input.includePrivate ?? true) {
    await ciSeedCorePrivateSettings({
      service: input.service,
      targetTenantScope: input.targetTenantScope,
      tenantId: input.tenantId,
    });
  }
}
