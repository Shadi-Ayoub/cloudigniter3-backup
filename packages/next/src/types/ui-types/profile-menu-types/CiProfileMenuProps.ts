import type { CiAuthProviderId } from "@cloudigniter/core/types";
import type { CiNextPageConfig } from "@ci-next/types";

export type CiProfileMenuProps = {
  config: CiNextPageConfig;
  dir: "ltr" | "rtl";
  provider?: CiAuthProviderId;
};
