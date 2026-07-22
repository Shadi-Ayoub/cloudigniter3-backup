import type { ReactNode } from "react";
import type { CiDevBeaconExtraTab } from "./CiDevBeaconExtraTab";
import type { CiDevBeaconTabValue } from "./CiDevBeaconTabValue";

export interface CiDevBeaconSideTabsListProps {
  loaded: boolean;
  defaultTab?: CiDevBeaconTabValue | string; // allow custom ids
  className?: string;
  statusContent?: ReactNode;
  configContent?: ReactNode;
  toolsContent?: ReactNode;

  /**
   * Extra tabs that have already been resolved into renderable content.
   */
  extraTabs?: CiDevBeaconExtraTab[];
}
