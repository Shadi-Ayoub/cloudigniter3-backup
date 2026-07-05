import type { CiLanguageFileDiagnostic } from "@ci-core/types";

export interface CiDevBeaconLanguageSummary {
  locale: string;
  pathname: string;
  namespace?: string;
  requestedFileNames: string[];
  files: CiLanguageFileDiagnostic[];
  effectiveMessageCount: number;
  overrideCount: number;
}
