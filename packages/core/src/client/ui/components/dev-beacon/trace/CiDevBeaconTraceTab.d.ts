import * as React from "react";
import type { CiDevBeaconTraceTabProps } from "@ci-core/types";
export declare function CiDevBeaconTraceTab({ endpoint, pollMs, tailBytes, // 128 KiB
maxLines, autoStart, }: CiDevBeaconTraceTabProps): import("react/jsx-runtime").JSX.Element;
/** Minimal adapter so you can append into your Dev Beacon `extraTabs`. */
export declare function devBeaconGetTraceTab(overrides?: CiDevBeaconTraceTabProps): {
    id: string;
    label: string;
    icon: React.ForwardRefExoticComponent<Omit<import("lucide-react").LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
    content: import("react/jsx-runtime").JSX.Element;
};
//# sourceMappingURL=CiDevBeaconTraceTab.d.ts.map