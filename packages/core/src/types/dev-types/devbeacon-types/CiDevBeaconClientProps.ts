import { type ReactNode } from "react";
import type {
  CiDevBeaconExtraTab,
  CiDevBeaconPosition,
  CiDevBeaconTabValue,
  CiDevBeaconTenantInfo,
  CiEnvMode,
  CiLocaleDirection,
} from "@/types";

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
