import type { CiDevBeaconLanguageFileStatus } from "./CiDevBeaconLanguageFileStatus";
import type { CiDevBeaconLanguageMessageEntry } from "./CiDevBeaconLanguageMessageEntry";
import type { CiDevBeaconLanguageMessageSource } from "./CiDevBeaconLanguageMessageSource";

export interface CiDevBeaconLanguageSourceMessages {
  id: string;
  source: CiDevBeaconLanguageMessageSource;
  fileName: string;
  status: CiDevBeaconLanguageFileStatus;
  entries: CiDevBeaconLanguageMessageEntry[];
}
