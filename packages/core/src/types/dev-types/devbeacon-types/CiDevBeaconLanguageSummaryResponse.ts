import type { CiLocaleDirection } from "@ci-core/types";
import type { CiDevBeaconLanguageDiagnostics } from "./CiDevBeaconLanguageDiagnostics";

export interface CiDevBeaconLanguageSummaryResponse {
  locale: string;
  dir: CiLocaleDirection;
  urlPath: string;
  namespace: string;
  requestedFileNames: string[];
  diagnostics: CiDevBeaconLanguageDiagnostics;
}
