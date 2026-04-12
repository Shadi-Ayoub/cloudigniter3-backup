import type { CiErrorSeverity } from "@cloudigniter/core";

export interface CiErrorPageProps {
  message: string;
  title?: string;
  severity?: CiErrorSeverity;
  showRetry?: boolean;
  onRetry?: () => void;
}
