import type {
  CiSetSettingsInput,
  CiSettings,
  CiSettingsService,
} from "@cloudigniter/core/types";

export async function ciSetSettings<TSettings extends CiSettings = CiSettings>(
  service: CiSettingsService,
  input: CiSetSettingsInput<TSettings>,
) {
  return service.set<TSettings>(input);
}
