import type {
  CiGetSettingsInput,
  CiSettings,
  CiSettingsService,
} from "@cloudigniter/core/types";

export async function ciGetSettings<TSettings extends CiSettings = CiSettings>(
  service: CiSettingsService,
  input: CiGetSettingsInput,
) {
  return service.get<TSettings>(input);
}
