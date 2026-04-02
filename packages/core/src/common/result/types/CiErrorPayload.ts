import type { CiErrorSeverity } from "./CiErrorSeverity";

// Generic error payload
export type CiErrorPayload = {
  id?: string; // unique identifier
  title?: string;
  name?: string; // error.name
  code?: string;
  message: string;
  isCritical?: boolean;
  severity?: CiErrorSeverity;
  showRetry?: boolean;
  stack?: string; // error.stack (only when process.env.NODE_ENV === 'development')
  raw?: unknown; // catch error
};
