import { ciError500, ciOk200 } from "@cloudigniter/core";

import type { CiSettings } from "../common/types/CiSettings";
import type { CiCreateSettingsServiceFromEnvInput } from "./types/CiCreateSettingsServiceFromEnvInput";
import type { CiSetSettingsApiInput } from "./types/CiSetSettingsApiInput";

/**
 * Persist one settings override record through a real runtime-backed service.
 *
 * @param input - API input.
 * @param runtime - Runtime service creation input.
 * @returns CloudIgniter result containing the persisted record.
 */
export async function ciSetSettings<TSettings extends CiSettings = CiSettings>(
  input: CiSetSettingsApiInput<TSettings>,
  runtime: CiCreateSettingsServiceFromEnvInput,
) {
  try {
    const { ciCreateSettingsServiceFromEnv } = await import(
      "./ci-create-settings-service-from-env"
    );
    const ciService = ciCreateSettingsServiceFromEnv(runtime);

    const ciRecord = await ciService.setRecord<TSettings>({
      settingsId: input.settingsId,
      scope: input.scope,
      targetTenantScope: input.targetTenantScope,
      tenantId: input.tenantId,
      userId: input.userId,
      value: input.value,
    });

    return ciOk200(ciRecord);
  } catch (error) {
    return ciError500(
      error instanceof Error ? error.message : "Failed to persist settings.",
      error,
    );
  }
}
