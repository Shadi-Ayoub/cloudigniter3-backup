"use client";

import React from "react";
import { FiAlertTriangle, FiXCircle, FiRefreshCw } from "react-icons/fi";
import { useCiPageLoaderStore } from "@/ui";
import type { CiErrorPageProps } from "../types";

export const CiErrorPage: React.FC<CiErrorPageProps> = ({
  message,
  title = "Something went wrong",
  severity = "error",
  showRetry = false,
  onRetry,
}) => {
  const { setLoading } = useCiPageLoaderStore();

  const Icon = severity === "warning" ? FiAlertTriangle : FiXCircle;
  const iconClass =
    severity === "warning"
      ? "ci-error-page-icon-warning"
      : "ci-error-page-icon-critical";

  const handleRetry = () => {
    setLoading(true);

    if (onRetry) return onRetry(); // prefer soft retry via Next.js reset()

    window.location.reload(); // fallback to hard reload
  };

  return (
    <>
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Icon size={56} className={`${iconClass}`} />
        <h1 className="ci-error-page-title">{title}</h1>
        <p className="ci-error-page-message">{message}</p>
        {showRetry && (
          <button onClick={handleRetry} className="ci-error-page-retry-button">
            <FiRefreshCw size={18} />
            Retry
          </button>
        )}
      </div>
    </>
  );
};
