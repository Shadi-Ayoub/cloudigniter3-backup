import { ciError500, ciOk200 } from "@cloudigniter/core";

import type { CiCreateSettingsServiceFromEnvInput } from "./types/CiCreateSettingsServiceFromEnvInput";
import type { CiDeleteSettingsApiInput } from "./types/CiDeleteSettingsApiInput";

/**
 * Delete one persisted settings override record through a real runtime-backed
 * service.
 *
 * @param input - API input.
 * @param runtime - Runtime service creation input.
 * @returns CloudIgniter result containing deletion status.
 */
export async function ciDeleteSettings(
  input: CiDeleteSettingsApiInput,
  runtime: CiCreateSettingsServiceFromEnvInput,
) {
  try {
    const { ciCreateSettingsServiceFromEnv } = await import(
      "./ci-create-settings-service-from-env"
    );
    const ciService = ciCreateSettingsServiceFromEnv(runtime);

    const ciDeleted = await ciService.deleteRecord({
      settingsId: input.settingsId,
      scope: input.scope,
      targetTenantScope: input.targetTenantScope,
      tenantId: input.tenantId,
      userId: input.userId,
    });

    return ciOk200({
      deleted: ciDeleted,
    });
  } catch (error) {
    return ciError500(
      error instanceof Error ? error.message : "Failed to delete settings.",
      error,
    );
  }
}
