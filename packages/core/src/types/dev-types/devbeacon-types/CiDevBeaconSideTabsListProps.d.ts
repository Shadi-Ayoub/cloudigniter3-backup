import type { ReactNode } from "react";
import type { CiDevBeaconExtraTab } from "./CiDevBeaconExtraTab";
import type { CiDevBeaconTabValue } from "./CiDevBeaconTabValue";
export interface CiDevBeaconSideTabsListProps {
    loaded: boolean;
    defaultTab?: CiDevBeaconTabValue | string;
    className?: string;
    statusContent?: ReactNode;
    configContent?: ReactNode;
    toolsContent?: ReactNode;
    /** NEW */
    extraTabs?: CiDevBeaconExtraTab[];
}
//# sourceMappingURL=CiDevBeaconSideTabsListProps.d.ts.map