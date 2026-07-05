import type { CiDevBeaconLanguageFileDiagnostic } from "./CiDevBeaconLanguageFileDiagnostic";

export interface CiDevBeaconLanguageDiagnostics {
  files: CiDevBeaconLanguageFileDiagnostic[];
  effectiveMessageCount: number;
  customOverrideCount: number;
}
