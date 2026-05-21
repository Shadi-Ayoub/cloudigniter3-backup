// export type CiAuthenticatorConfig = {
//   custom: {
//     merge: boolean;
//     signinSpinnereText: string;
//   };
//   disappeared: {
//     minHeightPx: number;
//     debounceMs: number;
//     initialMountSuppressMs: number;
//     minVisibleStableMs: number;
//   };
// };

export type CiAuthUiConfig = {
  custom?: {
    merge?: boolean;
    loadingText?: string;
  };
  visibility?: {
    minHeightPx?: number;
    debounceMs?: number;
    initialMountSuppressMs?: number;
    minVisibleStableMs?: number;
  };
};
