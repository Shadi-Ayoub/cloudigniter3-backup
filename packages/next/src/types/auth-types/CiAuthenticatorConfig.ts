export type CiAuthenticatorConfig = {
  custom: {
    merge: boolean;
    signinSpinnereText: string;
  };
  disappeared: {
    minHeightPx: number;
    debounceMs: number;
    initialMountSuppressMs: number;
    minVisibleStableMs: number;
  };
};
