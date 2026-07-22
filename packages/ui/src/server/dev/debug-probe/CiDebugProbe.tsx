import type { CiDebugProbeProps } from "@cloudigniter/core/types";
import { CiDebugProbeClient } from "@ci-ui/client";

export function CiDebugProbe(props: CiDebugProbeProps) {
  return <CiDebugProbeClient {...props} />;
}
