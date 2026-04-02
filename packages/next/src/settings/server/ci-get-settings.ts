import { ciError500, ciOk200 } from "@cloudigniter/core";

import type { CiSettings } from "../common/types/CiSettings";
import type { CiCreateSettingsServiceFromEnvInput } from "./types/CiCreateSettingsServiceFromEnvInput";
import type { CiGetSettingsApiInput } from "./types/CiGetSettingsApiInput";

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
    const { ciCreateSettingsServiceFromEnv } = await import(
      "./ci-create-settings-service-from-env"
    );
    const ciService = ciCreateSettingsServiceFromEnv(runtime);

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
      error,
    );
  }
}
