import type { CiDebugProbeProps } from "@cloudigniter/core/types";
import { CiDebugProbeClient } from "../../../client";

export function CiDebugProbe(props: CiDebugProbeProps) {
  if (props.enabled === false) return null;

  return <CiDebugProbeClient {...props} />;
}
