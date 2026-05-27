interface PageState {
    isLoading: boolean;
    loadingText: string;
    setLoading: (loading: boolean, text?: string) => void;
    setLoadingText: (text: string) => void;
}
export declare const useCiPageLoaderStore: import("zustand").UseBoundStore<import("zustand").StoreApi<PageState>>;
export {};
//# sourceMappingURL=ci-page-loader-store.d.ts.map