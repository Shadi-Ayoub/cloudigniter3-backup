import type { CiAuthProviderId } from "@cloudigniter/core";
import type { CiResolvedPageConfig } from "@/.";

export type CiProfileMenuProps = {
  config: CiResolvedPageConfig;
  dir: "ltr" | "rtl";
  provider?: CiAuthProviderId;
};
