import type { CiTraceConfig } from "@ci-core/types";
import type { CiAboutBorderBeamResolvedProps } from "./CiAboutBorderBeamResolvedProps";

export type CiAboutBorderBeamProps = CiAboutBorderBeamResolvedProps & {
  traceConfig: CiTraceConfig;
};
