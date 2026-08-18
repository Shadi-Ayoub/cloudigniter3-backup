import type { CiEmberguardAccessControlConfig } from "./CiEmberguardAccessControlConfig";

/** Provider-neutral EmberGuard configuration exposed through CloudIgniter auth. */
export type CiEmberguardConfig = {
  /** Access-control policy evaluation settings. */
  accessControl?: CiEmberguardAccessControlConfig;
};
