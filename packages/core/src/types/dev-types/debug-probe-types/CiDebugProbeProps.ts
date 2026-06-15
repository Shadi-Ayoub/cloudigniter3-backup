import type { CiJsonValue } from "@ci-core/types";
import type { CiDebugProbeOptions } from "./CiDebugProbeOptions";

export type CiDebugProbeProps = {
  id: string;
  title?: string;
  data?: CiJsonValue;

  /**
   * Overrides global debug-probe enablement.
   * Useful for Server Components where the provider value is not available.
   */
  enabled?: boolean;

  options?: CiDebugProbeOptions;
};
