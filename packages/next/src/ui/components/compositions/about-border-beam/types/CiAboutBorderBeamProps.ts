import type { CiResolvedPageConfig } from "@/.";
import { type BorderBeamProps } from "../../../shadcn/border-beam";

export interface CiAboutBorderBeamProps {
  config: CiResolvedPageConfig;
  title?: string;
  primaryText?: string;
  secondaryText?: string;
  options?: BorderBeamProps;
}
