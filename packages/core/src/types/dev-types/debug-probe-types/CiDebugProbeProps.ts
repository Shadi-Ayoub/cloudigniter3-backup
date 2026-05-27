import type { CiJsonValue } from "@ci-core/types";

export type CiDebugProbeProps = {
  id: string;
  title?: string;
  data?: CiJsonValue;
  enabled?: boolean;
};
