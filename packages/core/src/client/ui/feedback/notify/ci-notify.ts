"use client";

import { toast } from "sonner";
import type { ExternalToast } from "sonner";
import { useCiFeedbackStore } from "./ci-feedback-store"; // unified store
import { ciPresets } from "./ci-presets";
import type { CiFeedbackLevel, CiNotifyOptions } from "@ci-core/client";

type TitleT = React.ReactNode | (() => React.ReactNode);

function joinClassNames(a?: string, b?: string) {
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function normalizeSeverity(
  level: CiFeedbackLevel,
): "success" | "info" | "warning" | "error" | "critical" {
  switch (level) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "critical":
      return "critical";
    case "info":
    case "message":
    case "loading":
    default:
      return "info";
  }
}

export function ciNotify(
  level: CiFeedbackLevel,
  message: TitleT,
  options?: CiNotifyOptions,
) {
  const state = useCiFeedbackStore.getState();
  const channel = options?.channel ?? "toast";

  // -------- Modal path --------
  if (channel === "modal" || channel === "both") {
    const id =
      options?.modal?.id ??
      globalThis.crypto?.randomUUID?.() ??
      String(Date.now());
    const severity =
      options?.modal?.severityOverride ?? normalizeSeverity(level);

    // Modal requires a deterministic string message.
    const msgText =
      typeof message === "string"
        ? message
        : typeof options?.toast?.description === "string"
        ? options.toast.description
        : "Notification";

    state.push(
      {
        id,
        title: options?.modal?.title ?? null,
        message: msgText,
        severity,
        isCritical: options?.modal?.isCritical ?? severity === "critical",
      },
      {
        isSticky: options?.modal?.sticky ?? true,
        openModal: options?.modal?.open ?? true,
        channel,
      },
    );
  }

  // -------- Toast path --------
  if (channel === "toast" || channel === "both") {
    const { config } = state;
    if (!config.enabled) return;

    const token = config.toneTokens[level] ?? config.toneTokens.message;

    const merged: Partial<ExternalToast> = {
      ...ciPresets(level),
      ...config.toastDefaults,
      ...(options?.toast ?? {}), // spread last - developer wins
    };

    if (token) merged.className = joinClassNames(token, merged.className);

    switch (level) {
      case "success":
        return toast.success(message as any, merged as ExternalToast);
      case "warning":
        return toast.warning(message as any, merged as ExternalToast);
      case "error":
      case "critical":
        return toast.error(message as any, merged as ExternalToast);
      case "info":
        return toast.info(message as any, merged as ExternalToast);
      case "loading":
        return toast.loading(message as any, merged as ExternalToast);
      case "message":
      default:
        return toast(message as any, merged as ExternalToast);
    }
  }
}
