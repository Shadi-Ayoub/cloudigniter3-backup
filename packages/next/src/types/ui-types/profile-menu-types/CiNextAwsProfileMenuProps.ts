import type { CiProfileMenuProps } from "@cloudigniter/core/types";
import type { CiNextConfig } from "@ci-next/types";

export type CiNextAwsProfileMenuProps = Omit<CiProfileMenuProps, "onLogout"> & {
  config: CiNextConfig;
  logoutRedirectTo?: string;
};
