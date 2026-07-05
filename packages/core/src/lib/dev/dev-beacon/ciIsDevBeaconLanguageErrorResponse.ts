import type { CiDevBeaconLanguageErrorResponse } from "@ci-core/types";

export function ciIsDevBeaconLanguageErrorResponse(
  value: unknown,
): value is CiDevBeaconLanguageErrorResponse {
  return typeof value === "object" && value !== null && "error" in value;
}
