import type {
  CiSetSettingsInput,
  CiSettings,
  CiSettingsRecord,
  CiSettingsService,
} from "@cloudigniter/core/types";

/**
 * Set a settings record through the provided settings service.
 */
export async function ciSetSettings<TSettings extends CiSettings = CiSettings>(
  service: CiSettingsService,
  input: CiSetSettingsInput<TSettings>,
): Promise<CiSettingsRecord<TSettings>> {
  return service.set<TSettings>(input);
}
