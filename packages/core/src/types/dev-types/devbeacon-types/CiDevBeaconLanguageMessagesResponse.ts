import type { CiDevBeaconLanguageSummaryResponse } from "./CiDevBeaconLanguageSummaryResponse";
import type { CiDevBeaconLanguageMessageEntry } from "./CiDevBeaconLanguageMessageEntry";
import type { CiDevBeaconLanguageSourceMessages } from "./CiDevBeaconLanguageSourceMessages";

export interface CiDevBeaconLanguageMessagesResponse
  extends CiDevBeaconLanguageSummaryResponse {
  effectiveMessages: CiDevBeaconLanguageMessageEntry[];
  sourceMessages: CiDevBeaconLanguageSourceMessages[];
}
