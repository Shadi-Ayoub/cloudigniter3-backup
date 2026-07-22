import type {
  CiDevBeaconExtraTabSpec,
  CiDevBeaconLogoSpec,
  CiDevBeaconPosition,
  CiDevBeaconTabValue,
} from "@ci-core/types";

export interface CiDevBeaconClientProps<CTX> {
  context: CTX;

  position?: CiDevBeaconPosition;
  logo?: CiDevBeaconLogoSpec;
  defaultTab?: CiDevBeaconTabValue | string;
  isContentLoaded?: boolean;
  onRequestMarkLoaded?: (fn: (loaded: boolean) => void) => void;
  extraTabs?: CiDevBeaconExtraTabSpec[];
  viewportTopOffset?: string;
  viewportBottomOffset?: string;
}
