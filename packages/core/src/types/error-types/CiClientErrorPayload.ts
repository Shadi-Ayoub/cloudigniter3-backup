import type { CiErrorSeverity } from "@ci-core/types";

// Client-side tracked error payloads (e.g. store, notifications)
export type CiClientErrorPayload = {
  id: string; // unique identifier
  message: string;
  isCritical: boolean;
  severity: CiErrorSeverity;
};
