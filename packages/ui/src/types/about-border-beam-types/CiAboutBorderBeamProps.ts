import type { CiTraceConfig } from "@cloudigniter/core/types";
import type { CiAboutBorderBeamResolvedProps } from "./CiAboutBorderBeamResolvedProps";

export type CiAboutBorderBeamProps = CiAboutBorderBeamResolvedProps & {
  traceConfig: CiTraceConfig;
};
