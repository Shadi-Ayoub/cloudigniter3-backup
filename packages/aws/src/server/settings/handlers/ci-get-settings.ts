import {
  ciError500,
  ciOk200,
  ciSerializeUnknownError,
  type CiSettings,
} from "@cloudigniter/core";
import { type CiGetSettingsApiInput } from "@cloudigniter/core/server";
import {
  ciCreateSettingsServiceFromEnv,
  type CiCreateSettingsServiceFromEnvInput,
} from "../";

/**
 * Resolve final merged settings through a real runtime-backed settings service.
 *
 * @param input - API input.
 * @param runtime - Runtime service creation input.
 * @returns CloudIgniter result containing resolved settings.
 */
export async function ciGetSettings<TSettings extends CiSettings = CiSettings>(
  input: CiGetSettingsApiInput,
  runtime: CiCreateSettingsServiceFromEnvInput,
) {
  try {
    const ciServiceResult = await ciCreateSettingsServiceFromEnv(runtime);

    if (!ciServiceResult.ok) {
      return ciServiceResult;
    }

    const ciService = ciServiceResult.body;

    const ciResult = await ciService.getResolved<TSettings>({
      registry: input.registry,
      settingsId: input.settingsId,
      scope: input.scope,
      context: input.context,
    });

    return ciOk200(ciResult);
  } catch (error) {
    return ciError500(
      error instanceof Error ? error.message : "Failed to resolve settings.",
      ciSerializeUnknownError(error),
    );
  }
}
