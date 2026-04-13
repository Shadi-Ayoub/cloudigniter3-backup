import { type ReactNode } from "react";

import type { CiEnvMode, CiLocaleDirection } from "@cloudigniter/core";
import type {
  CiDevBeaconExtraTab,
  CiDevBeaconPosition,
  CiDevBeaconTabValue,
  CiDevBeaconTenantInfo,
} from "./";

export interface CiDevBeaconClientProps {
  dir?: CiLocaleDirection;
  position?: CiDevBeaconPosition;
  env?: CiEnvMode;
  logo?: ReactNode;
  defaultTab?: CiDevBeaconTabValue | string;

  isContentLoaded?: boolean;
  onRequestMarkLoaded?: (fn: (loaded: boolean) => void) => void;

  extraTabs?: CiDevBeaconExtraTab[];
  viewportTopOffset?: string;
  viewportBottomOffset?: string;

  tenant?: CiDevBeaconTenantInfo;
}
