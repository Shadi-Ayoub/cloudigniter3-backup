import type {
  CiDeleteSettingsInput,
  CiSettingsService,
} from "@cloudigniter/core/types";

export async function ciDeleteSettings(
  service: CiSettingsService,
  input: CiDeleteSettingsInput,
) {
  return service.delete(input);
}
