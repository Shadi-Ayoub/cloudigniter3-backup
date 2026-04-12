import {
  ciError500,
  ciOk200,
  ciSerializeUnknownError,
  type CiSettings,
} from "@cloudigniter/core";
import { type CiSetSettingsApiInput } from "@cloudigniter/core/server";
import {
  ciCreateSettingsServiceFromEnv,
  type CiCreateSettingsServiceFromEnvInput,
} from "../";

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
    const ciServiceResult = await ciCreateSettingsServiceFromEnv(runtime);

    if (!ciServiceResult.ok) {
      return ciServiceResult;
    }

    const ciService = ciServiceResult.body;

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
      ciSerializeUnknownError(error),
    );
  }
}
