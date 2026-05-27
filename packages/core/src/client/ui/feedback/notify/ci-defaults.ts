import type { CiFeedbackSonnerConfig } from "@ci-core/client";

export const CI_DEFAULT_FEEDBACK_CONFIG: Required<CiFeedbackSonnerConfig> = {
  enabled: true,
  toaster: {
    theme: "system",
    position: "top-right",
    richColors: true,
    closeButton: true,
    visibleToasts: 3,
    duration: 3500,
  },
  toastDefaults: {
    dismissible: true,
  },
  toneTokens: {
    success: "ci-toast-success",
    error: "ci-toast-error",
    warning: "ci-toast-warning",
    info: "ci-toast-info",
    loading: "ci-toast-loading",
    message: "ci-toast-message",
    critical: "ci-toast-error", // usually same as error unless you want a special class
  },
};
