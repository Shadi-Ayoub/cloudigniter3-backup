"use client";

import { useEffect, useMemo } from "react";
import { Toaster, type ToasterProps } from "sonner";
import { useCiFeedbackStore } from "@ci-core/client";
import type {
  CiFeedbackSonnerConfig,
  CiFeedbackRuntimeOverrides,
} from "@ci-core/client";

/**
 * Deep-merge only:
 * - toastOptions
 * - toastOptions.classNames
 *
 * Precedence (later wins):
 * base.toastOptions.classNames
 * → toneTokens (CI semantic)
 */
function mergeToasterWithToneTokens(
  base: Partial<ToasterProps>,
  toneTokens: Record<string, string | undefined>,
): Partial<ToasterProps> {
  const baseToastOptions = base.toastOptions ?? {};
  const baseClassNames = (baseToastOptions as any).classNames ?? {};

  const mergedToastOptions = {
    ...baseToastOptions,
    classNames: {
      ...baseClassNames,
      ...toneTokens, // toneTokens win over existing classNames by default
    },
  };

  return { ...base, toastOptions: mergedToastOptions as any };
}

export function CiFeedbackProvider(props: {
  initialConfig?: CiFeedbackSonnerConfig;
  overrides?: CiFeedbackRuntimeOverrides;
}) {
  const { config, setConfig } = useCiFeedbackStore();

  // If your setConfig() internally resolves defaults, pass only initialConfig.
  useEffect(() => {
    setConfig(props.initialConfig);
  }, [props.initialConfig, setConfig]);

  if (!config.enabled) return null;

  const toasterProps = useMemo(() => {
    // Merge order: resolved store config → runtime overrides (spread last)
    // (Do NOT re-apply ciDefaultFeedbackConfig here if store is already resolved.)
    const merged: Partial<ToasterProps> = {
      ...config.toaster,
      ...(props.overrides?.toaster ?? {}),
    };

    // Merge toneTokens: store → runtime overrides
    const toneTokens = {
      ...config.toneTokens,
      ...(props.overrides?.toneTokens ?? {}),
    };

    // Inject tone tokens into toastOptions.classNames without clobbering other toastOptions
    return mergeToasterWithToneTokens(merged, toneTokens);
  }, [
    config.toaster,
    config.toneTokens,
    props.overrides?.toaster,
    props.overrides?.toneTokens,
  ]);

  return <Toaster {...toasterProps} />;
}
