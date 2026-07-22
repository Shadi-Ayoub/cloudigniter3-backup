import type { CiProfileMenuProps } from "@cloudigniter/core/types";
import type { CiNextPageConfig } from "@ci-next/types";

export type CiNextAwsProfileMenuProps = Omit<CiProfileMenuProps, "onLogout"> & {
  config: CiNextPageConfig;
  logoutRedirectTo?: string;
};
