import { type ReactNode } from "react";
import type {
  CiDevBeaconExtraTab,
  CiDevBeaconPosition,
  CiDevBeaconTabValue,
  CiDevBeaconTenantInfo,
  CiEnvMode,
  CiLocaleDirection,
} from "@ci-core/types";

export interface CiDevBeaconClientProps {
  // general
  position?: CiDevBeaconPosition;
  env?: CiEnvMode;
  logo?: ReactNode;
  defaultTab?: CiDevBeaconTabValue | string;
  isContentLoaded?: boolean;
  onRequestMarkLoaded?: (fn: (loaded: boolean) => void) => void;
  extraTabs?: CiDevBeaconExtraTab[];
  viewportTopOffset?: string;
  viewportBottomOffset?: string;

  // for tenant resolution diagnostics
  tenant?: CiDevBeaconTenantInfo;

  // for language diagnostics
  locale: string;
  dir: CiLocaleDirection;
  languageDiagnosticsEndpoint?: string;
}
