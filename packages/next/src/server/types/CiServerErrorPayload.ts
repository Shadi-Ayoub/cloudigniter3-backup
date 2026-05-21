import type { CiErrorSeverity } from "@cloudigniter/core/types";

// Server-thrown error payloads (App Router → error.tsx)
export type CiServerErrorPayload = {
  title?: string;
  name?: string; // error.name
  message?: string;
  stack?: string; // error.stack (only when process.env.NODE_ENV === 'development')
  raw?: unknown; // catch error
  severity?: CiErrorSeverity;
  showRetry?: boolean;
};
