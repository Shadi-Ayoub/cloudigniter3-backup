import type { CiErrorSeverity } from "@ci-core/types";

export interface CiErrorPageProps {
  message: string;
  title?: string;
  severity?: CiErrorSeverity;
  showRetry?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
}
