import { create } from "zustand";

interface PageState {
  isLoading: boolean;
  loadingText: string;
  setLoading: (loading: boolean, text?: string) => void;
  setLoadingText: (text: string) => void;
}

const defaultLoadingText = "Loading...";

function resolveText(
  loading: boolean,
  text: string | undefined,
  stateText: string,
) {
  if (!loading) {
    return defaultLoadingText;
  }

  return text ?? stateText;
}

export const useCiPageLoaderStore = create<PageState>()((set) => ({
  isLoading: true,
  loadingText: "Loading...", // default text

  setLoading: (loading, text) =>
    set((state) => ({
      isLoading: loading,
      loadingText: resolveText(loading, text, state.loadingText),
    })),

  setLoadingText: (text) => set({ loadingText: text }),
}));

// persist(
//     (set) => ({
//       isLoading: true,
//       loadingText: 'Loading...', // default text

//       setLoading: (loading, text) =>
//         set((state) => ({
//           isLoading: loading,
//           loadingText: text ?? state.loadingText,
//         })),

//       setLoadingText: (text) => set({ loadingText: text }),
//     }),
//     {
//       name: 'page-store', // Key in local storage
//     }
//   )
