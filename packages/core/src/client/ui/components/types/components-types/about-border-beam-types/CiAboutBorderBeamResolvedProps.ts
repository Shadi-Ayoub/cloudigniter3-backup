import type { BorderBeamProps } from "@ci-core/client";

export type CiAboutBorderBeamResolvedProps = {
  title?: string;
  primaryText?: string;
  secondaryText?: string;
  // options?: Record<string, unknown>;
  options?: BorderBeamProps;
};
