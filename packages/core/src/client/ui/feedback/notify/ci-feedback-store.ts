"use client";

import { create } from "zustand";
import { ciResolveFeedbackConfig } from "./ci-resolve-config";
import {
  type CiFeedbackSonnerConfig,
  type CiFeedbackSonnerConfigResolved,
  type CiClientFeedbackPayload,
  type CiDeliveryChannel,
} from "@/client";

export type PushOptions = {
  isSticky?: boolean;
  openModal?: boolean;
  channel?: CiDeliveryChannel;
};

type FeedbackState = {
  // ---- CiConfig (Sonner + CI tokens) ----
  config: CiFeedbackSonnerConfigResolved;
  setConfig: (cfg?: CiFeedbackSonnerConfig) => void;

  // ---- Modal/Card queue state ----
  items: CiClientFeedbackPayload[];
  isModalOpen: boolean;
  isSticky: boolean;

  // ---- Actions ----
  push: (
    payload: Omit<CiClientFeedbackPayload, "createdAt">,
    options?: PushOptions,
  ) => void;

  // Backward compatibility (your current API)
  triggerError: (
    id: string,
    message: string,
    severity: "info" | "warning" | "error" | "critical",
    options?: { isSticky: boolean },
  ) => void;

  openModal: () => void;
  closeModal: () => void;

  clear: (id: string) => void;
  clearAll: () => void;

  exists: (id: string) => boolean;
  getById: (id: string) => CiClientFeedbackPayload | null;
  getLast: () => CiClientFeedbackPayload | null;

  // Backward compatibility accessor
  getLastError: () => CiClientFeedbackPayload | null;
};

export const useCiFeedbackStore = create<FeedbackState>((set, get) => ({
  // CiConfig
  config: ciResolveFeedbackConfig(),
  setConfig: (cfg) =>
    set(() => ({
      config: ciResolveFeedbackConfig(cfg),
    })),

  // Modal/Card state
  items: [],
  isModalOpen: true,
  isSticky: true,

  push: (payload, options) => {
    // Keep your logging behavior
    switch (payload.severity) {
      case "success":
      case "info":
        console.info(`[${payload.severity}] ${payload.message}`);
        break;
      case "warning":
        console.warn(`[Warning] ${payload.message}`);
        break;
      case "error":
      case "critical":
        console.error(
          `[Error] Severity: ${payload.severity}, Message: ${payload.message}`,
        );
        break;
      default:
        console.log(`[Log] ${payload.message}`);
    }

    const sticky = options?.isSticky ?? get().isSticky;
    const openModal = options?.openModal ?? true;

    set((state) => ({
      items: [
        ...state.items.filter((x) => x.id !== payload.id), // avoid duplicates by id
        { ...payload, createdAt: Date.now() },
      ],
      isSticky: sticky,
      isModalOpen: openModal,
    }));
  },

  triggerError: (id, message, severity, options = { isSticky: true }) => {
    const isCritical = severity === "critical";

    get().push(
      {
        id,
        title: null,
        message,
        severity,
        isCritical,
      },
      { isSticky: options.isSticky, openModal: true, channel: "modal" },
    );
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () =>
    set((state) => ({
      isModalOpen: false,
      ...(state.isSticky ? {} : { items: [] }),
    })),

  clear: (id) =>
    set((state) => {
      const next = state.items.filter((x) => x.id !== id);
      return {
        items: next,
        isModalOpen: next.length > 0 ? state.isModalOpen : false,
      };
    }),

  clearAll: () => set({ items: [], isModalOpen: false }),

  exists: (id) => get().items.some((x) => x.id === id),
  getById: (id) => get().items.find((x) => x.id === id) || null,
  getLast: () => {
    const last = get().items.at(-1);
    return last ?? null;
  },
  getLastError: () => get().getLast(),
}));
