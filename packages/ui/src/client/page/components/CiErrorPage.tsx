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
  actions,
  statusCode,
  illustration,
  errorLabel = "Error",
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

  if (statusCode) {
    return (
      <section className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-6 py-10 text-foreground sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="flex w-full max-w-lg flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-muted-foreground sm:text-sm">
            {errorLabel}
          </p>
          <div className="relative mt-1 select-none" dir="ltr">
            <span
              aria-hidden="true"
              className="absolute inset-0 translate-x-1.5 translate-y-1.5 text-7xl font-black tracking-tighter text-primary/10 sm:text-9xl"
            >
              {statusCode}
            </span>
            <span className="relative text-7xl font-black tracking-tighter text-foreground sm:text-9xl">
              {statusCode}
            </span>
          </div>
          {illustration && (
            <div
              aria-hidden="true"
              className="relative -mt-2 w-56 sm:-mt-4 sm:w-64 md:w-72"
            >
              {illustration}
            </div>
          )}
          <h1 className="-mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
            {message}
          </p>
          {actions && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <Icon size={56} className={iconClass} aria-hidden />
      <h1 className="ci-error-page-title">{title}</h1>
      <p className="ci-error-page-message">{message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {showRetry ? (
          <button
            type="button"
            onClick={handleRetry}
            className="ci-error-page-retry-button min-h-11"
          >
            <FiRefreshCw size={18} aria-hidden />
            {retryLabel}
          </button>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
