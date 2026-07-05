import type { CiDevBeaconLanguageFileStatus } from "./CiDevBeaconLanguageFileStatus";
import type { CiDevBeaconLanguageMessageSource } from "./CiDevBeaconLanguageMessageSource";

export interface CiDevBeaconLanguageFileDiagnostic {
  id: string;
  source: CiDevBeaconLanguageMessageSource;
  locale: string;
  fileName: string;
  status: CiDevBeaconLanguageFileStatus;
  messageCount: number;
  overriddenKeyCount: number;
  error?: string;
}
