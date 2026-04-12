import {
  ciError500,
  ciOk200,
  ciSerializeUnknownError,
} from "@cloudigniter/core";
import { type CiDeleteSettingsApiInput } from "@cloudigniter/core/server";
import {
  ciCreateSettingsServiceFromEnv,
  type CiCreateSettingsServiceFromEnvInput,
} from "../";

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
    const ciServiceResult = await ciCreateSettingsServiceFromEnv(runtime);

    if (!ciServiceResult.ok) {
      return ciServiceResult;
    }

    const ciService = ciServiceResult.body;

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
      ciSerializeUnknownError(error),
    );
  }
}
