import type { CiDebugProbeProps } from "@cloudigniter/core/types";
import { CiDebugProbeClient } from "../../../client";

export function CiDebugProbe(props: CiDebugProbeProps) {
  return <CiDebugProbeClient {...props} />;
}
