export type CiAuthenticatorConfig = {
  custom: {
    merge: boolean;
    signinSpinnereText: string;
  };
  visibility: {
    minHeightPx: number;
    debounceMs: number;
    initialMountSuppressMs: number;
    minVisibleStableMs: number;
  };
};
