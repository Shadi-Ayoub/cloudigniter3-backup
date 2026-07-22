"use client";

import { FiAlertTriangle, FiRefreshCw, FiXCircle } from "react-icons/fi";
import type { CiErrorPageProps } from "@cloudigniter/core/types";

export function CiErrorPage({
  message,
  title = "Something went wrong",
  severity = "error",
  showRetry = false,
  onRetry,
  retryLabel = "Retry",
}: CiErrorPageProps) {
  const Icon = severity === "warning" ? FiAlertTriangle : FiXCircle;
  const iconClass =
    severity === "warning"
      ? "ci-error-page-icon-warning"
      : "ci-error-page-icon-critical";

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      return;
    }

    window.location.reload();
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <Icon size={56} className={iconClass} />
      <h1 className="ci-error-page-title">{title}</h1>
      <p className="ci-error-page-message">{message}</p>

      {showRetry ? (
        <button onClick={handleRetry} className="ci-error-page-retry-button">
          <FiRefreshCw size={18} />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
