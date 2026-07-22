import type {
  CiDevBeaconExtraTab,
  CiDevBeaconSideTabsListProps,
  CiDevBeaconTabValue,
  CiEnvMode,
  CiLocaleDirection,
} from "@cloudigniter/core/types";

export interface CiDevBeaconModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  env?: CiEnvMode;
  loaded: boolean;
  defaultTab?: CiDevBeaconTabValue | string;
  dir?: CiLocaleDirection;
  SideTabsList: React.ComponentType<CiDevBeaconSideTabsListProps>;
  SectionStatus: React.ComponentType;
  SectionConfig: React.ComponentType;
  SectionTools: React.ComponentType<{
    onMarkLoaded: () => void;
  }>;
  headerActions?: React.ReactNode;
  className?: string;
  title?: string;

  /**
   * Extra tabs that have already been resolved into renderable content.
   */
  extraTabs?: CiDevBeaconExtraTab[];

  viewportTopOffset?: string;
  viewportBottomOffset?: string;
}
