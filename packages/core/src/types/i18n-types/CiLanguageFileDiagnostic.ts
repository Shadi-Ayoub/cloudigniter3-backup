import type { CiLanguageFileStatus } from "./CiLanguageFileStatus";

export interface CiLanguageFileDiagnostic {
  id: string;
  layer: "core" | "custom";
  locale: string;
  fileName: string;
  status: CiLanguageFileStatus;
  messageCount: number;
  overriddenKeyCount?: number;
  error?: string;
}
