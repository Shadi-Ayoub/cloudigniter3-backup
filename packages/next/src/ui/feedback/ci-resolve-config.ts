// client/feedback/resolveConfig.ts
import type {
  CiFeedbackSonnerConfig,
  CiFeedbackSonnerConfigResolved,
} from "./types";
import { ciDefaultFeedbackConfig } from "./ci-defaults";

export function ciResolveFeedbackConfig(
  input?: CiFeedbackSonnerConfig,
): CiFeedbackSonnerConfigResolved {
  return {
    enabled: input?.enabled ?? ciDefaultFeedbackConfig.enabled,
    toaster: { ...ciDefaultFeedbackConfig.toaster, ...(input?.toaster ?? {}) },
    toastDefaults: {
      ...ciDefaultFeedbackConfig.toastDefaults,
      ...(input?.toastDefaults ?? {}),
    },
    toneTokens: {
      ...ciDefaultFeedbackConfig.toneTokens,
      ...(input?.toneTokens ?? {}),
    },
  };
}
