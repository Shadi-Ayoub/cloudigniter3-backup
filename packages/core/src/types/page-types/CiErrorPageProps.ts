import type { CiErrorSeverity } from "@ci-core/types";
import type { ReactNode } from "react";

export interface CiErrorPageProps {
  message: string;
  title?: string;
  severity?: CiErrorSeverity;
  showRetry?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  /** Recovery navigation or other actions rendered beside Retry. */
  actions?: ReactNode;
  /** Display the illustrated HTTP layout instead of the inline alert. */
  statusCode?: 403 | 404;
  /** Decorative artwork for the HTTP layout; the heading conveys its meaning. */
  illustration?: ReactNode;
  /** Localized label above the HTTP status. */
  errorLabel?: string;
}
