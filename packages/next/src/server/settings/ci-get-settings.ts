import type {
  CiGetSettingsInput,
  CiResolvedSettings,
  CiSettings,
  CiSettingsService,
} from "@cloudigniter/core/types";

/**
 * Get settings through the provided settings service.
 */
export async function ciGetSettings<TSettings extends CiSettings = CiSettings>(
  service: CiSettingsService,
  input: CiGetSettingsInput,
): Promise<CiResolvedSettings<TSettings>> {
  return service.get<TSettings>(input);
}
