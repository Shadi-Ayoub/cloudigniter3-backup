import type { CiDebugProbeProps } from "@ci-core/types";
import { CiDebugProbeClient } from "@ci-core/client";

export function CiDebugProbe(props: CiDebugProbeProps) {
  if (props.enabled === false) return null;

  return <CiDebugProbeClient {...props} />;
}
