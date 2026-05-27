import { type CiFeedbackSonnerConfig, type CiFeedbackSonnerConfigResolved, type CiClientFeedbackPayload, type CiDeliveryChannel } from "@ci-core/client";
export type PushOptions = {
    isSticky?: boolean;
    openModal?: boolean;
    channel?: CiDeliveryChannel;
};
type FeedbackState = {
    config: CiFeedbackSonnerConfigResolved;
    setConfig: (cfg?: CiFeedbackSonnerConfig) => void;
    items: CiClientFeedbackPayload[];
    isModalOpen: boolean;
    isSticky: boolean;
    push: (payload: Omit<CiClientFeedbackPayload, "createdAt">, options?: PushOptions) => void;
    triggerError: (id: string, message: string, severity: "info" | "warning" | "error" | "critical", options?: {
        isSticky: boolean;
    }) => void;
    openModal: () => void;
    closeModal: () => void;
    clear: (id: string) => void;
    clearAll: () => void;
    exists: (id: string) => boolean;
    getById: (id: string) => CiClientFeedbackPayload | null;
    getLast: () => CiClientFeedbackPayload | null;
    getLastError: () => CiClientFeedbackPayload | null;
};
export declare const useCiFeedbackStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FeedbackState>>;
export {};
//# sourceMappingURL=ci-feedback-store.d.ts.map