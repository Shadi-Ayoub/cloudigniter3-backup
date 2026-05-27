import * as React from "react";
import type { CiEnvMode } from "@ci-core/types";
import type { CiDevBeaconExtraTab, CiDevBeaconTabValue } from "@ci-core/types";
type CiSideTabsListProps = {
    loaded: boolean;
    defaultTab: CiDevBeaconTabValue | string;
    className?: string;
    statusContent?: React.ReactNode;
    configContent?: React.ReactNode;
    toolsContent?: React.ReactNode;
    extraTabs?: CiDevBeaconExtraTab[];
};
export interface CiDevBeaconModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    env?: CiEnvMode;
    loaded: boolean;
    defaultTab?: CiDevBeaconTabValue | string;
    dir?: "ltr" | "rtl";
    SideTabsList: React.ComponentType<CiSideTabsListProps>;
    SectionStatus: React.ComponentType;
    SectionConfig: React.ComponentType;
    SectionTools: React.ComponentType<{
        onMarkLoaded: () => void;
    }>;
    headerActions?: React.ReactNode;
    className?: string;
    title?: string;
    extraTabs?: CiDevBeaconExtraTab[];
    viewportTopOffset?: string;
    viewportBottomOffset?: string;
}
export declare function CiDevBeaconModal({ open, onOpenChange, env, loaded, defaultTab, dir, SideTabsList, SectionStatus, SectionConfig, SectionTools, headerActions, className, title, extraTabs, viewportTopOffset, viewportBottomOffset, }: CiDevBeaconModalProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=CiDevBeaconModal.d.ts.map