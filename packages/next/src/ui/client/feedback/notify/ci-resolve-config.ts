import type {
  CiFeedbackSonnerConfig,
  CiFeedbackSonnerConfigResolved,
} from "@ci-next/ui/client";
import { CI_DEFAULT_FEEDBACK_CONFIG } from "./ci-defaults";

export function ciResolveFeedbackConfig(
  input?: CiFeedbackSonnerConfig,
): CiFeedbackSonnerConfigResolved {
  return {
    enabled: input?.enabled ?? CI_DEFAULT_FEEDBACK_CONFIG.enabled,
    toaster: {
      ...CI_DEFAULT_FEEDBACK_CONFIG.toaster,
      ...(input?.toaster ?? {}),
    },
    toastDefaults: {
      ...CI_DEFAULT_FEEDBACK_CONFIG.toastDefaults,
      ...(input?.toastDefaults ?? {}),
    },
    toneTokens: {
      ...CI_DEFAULT_FEEDBACK_CONFIG.toneTokens,
      ...(input?.toneTokens ?? {}),
    },
  };
}
